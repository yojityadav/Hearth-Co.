import { useState, type FormEvent } from "react";
import { CATEGORIES, LOW_STOCK_THRESHOLD, money, stockStatus, useStore, type Product } from "@/lib/store";
import { ProductImage } from "./ProductImage";

type Draft = { name: string; description: string; category: string; price: string; stock: string; image: string };
const blank: Draft = { name: "", description: "", category: CATEGORIES[0] ?? "Home", price: "", stock: "", image: "" };

function validate(d: Draft) {
  const e: Partial<Record<keyof Draft, string>> = {};
  if (d.name.trim().length < 2) e.name = "Name must be at least 2 characters";
  if (d.name.trim().length > 80) e.name = "Name must be under 80 characters";
  if (d.description.length > 200) e.description = "Max 200 characters";
  const price = Number(d.price);
  if (d.price === "" || isNaN(price) || price <= 0 || price > 100000) e.price = "Enter a price greater than 0";
  const stock = Number(d.stock);
  if (d.stock === "" || !Number.isInteger(stock) || stock < 0 || stock > 100000) e.stock = "Enter a whole number ≥ 0";
  if (d.image && !/^(https?:\/\/|\/)/.test(d.image.trim())) e.image = "Must be a URL starting with http(s):// or /";
  return e;
}

export function AdminPanel({ notify }: { notify: (msg: string, tone?: "ok" | "error") => void }) {
  const { products, ready, addProduct, updateProduct, deleteProduct, resetDemo } = useStore();
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [filter, setFilter] = useState("");

  const stats = [
    { label: "Total products", value: products.length, tone: "text-foreground" },
    { label: "Total stock", value: products.reduce((s, p) => s + p.stock, 0), tone: "text-primary" },
    { label: "Low stock", value: products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length, tone: "text-warning" },
    { label: "Out of stock", value: products.filter((p) => p.stock === 0).length, tone: "text-destructive" },
  ];
  const visible = products.filter((p) => p.name.toLowerCase().includes(filter.trim().toLowerCase()));

  const quickStock = (p: Product, delta: number) => updateProduct(p.id, { stock: Math.max(0, p.stock + delta) });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-foreground">Changes apply instantly to the storefront. Low stock = {LOW_STOCK_THRESHOLD} or fewer.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => { if (confirm("Reset all products and cart to sample data?")) { resetDemo(); notify("Sample data restored"); } }}>
            Reset demo
          </button>
          <button className="btn btn-primary" onClick={() => setEditing("new")}>+ Add product</button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className={`mt-1 font-display text-3xl font-semibold ${s.tone}`}>{ready ? s.value : "—"}</p>
          </div>
        ))}
      </div>

      <input className="field mb-4 md:max-w-xs" type="search" placeholder="Filter by name…" aria-label="Filter products" value={filter} onChange={(e) => setFilter(e.target.value)} />

      {!ready ? (
        <div className="surface p-10 text-center text-muted-foreground animate-pulse">Loading inventory…</div>
      ) : visible.length === 0 ? (
        <div className="surface p-12 text-center">
          <h3 className="text-xl font-semibold">{products.length === 0 ? "No products yet" : "No matches"}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{products.length === 0 ? "Add your first product to start selling." : "Try a different name."}</p>
          {products.length === 0 && <button className="btn btn-primary mt-4" onClick={() => setEditing("new")}>+ Add product</button>}
        </div>
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.map((p) => {
                const s = stockStatus(p.stock);
                return (
                  <tr key={p.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductImage src={p.image} alt={p.name} className="h-10 w-10 rounded-md" />
                        <span className="font-semibold">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                    <td className="px-4 py-3 font-semibold">{money(p.price)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="btn btn-outline !h-7 !w-7 !p-0" aria-label={`Decrease stock of ${p.name}`} disabled={p.stock === 0} onClick={() => quickStock(p, -1)}>−</button>
                        <span className="w-10 text-center font-semibold">{p.stock}</span>
                        <button className="btn btn-outline !h-7 !w-7 !p-0" aria-label={`Increase stock of ${p.name}`} onClick={() => quickStock(p, 1)}>+</button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.tone === "out" ? "bg-destructive/15 text-destructive" : s.tone === "low" ? "bg-warning/20 text-foreground" : "bg-success/15 text-success"}`}>
                        {s.tone === "low" ? "Low stock" : s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="btn btn-ghost !px-2.5 !py-1" onClick={() => setEditing(p)}>Edit</button>
                      <button className="btn btn-ghost !px-2.5 !py-1 text-destructive" onClick={() => setConfirmDelete(p)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ProductForm
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSave={(data) => {
            if (editing === "new") { addProduct(data); notify(`Added "${data.name}"`); }
            else { updateProduct(editing.id, data); notify(`Updated "${data.name}"`); }
            setEditing(null);
          }}
        />
      )}

      {confirmDelete && (
        <Modal title="Delete product?" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-muted-foreground">"{confirmDelete.name}" will be removed from the store and any carts. This cannot be undone.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => { deleteProduct(confirmDelete.id); notify(`Deleted "${confirmDelete.name}"`); setConfirmDelete(null); }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ProductForm({ initial, onSave, onCancel }: { initial: Product | null; onSave: (p: Omit<Product, "id">) => void; onCancel: () => void }) {
  const [d, setD] = useState<Draft>(
    initial ? { ...initial, price: String(initial.price), stock: String(initial.stock) } : blank,
  );
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(d);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({
      name: d.name.trim(),
      description: d.description.trim(),
      category: d.category,
      price: Math.round(Number(d.price) * 100) / 100,
      stock: Number(d.stock),
      image: d.image.trim(),
    });
  };

  const input = (k: keyof Draft, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`f-${k}`} className="mb-1 block text-sm font-medium">{label}</label>
      <input id={`f-${k}`} className="field" aria-invalid={!!errors[k]} value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })} {...extra} />
      {errors[k] && <p className="mt-1 text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <Modal title={initial ? "Edit product" : "Add product"} onClose={onCancel}>
      <form onSubmit={submit} noValidate className="space-y-3">
        {input("name", "Name")}
        {input("description", "Description")}
        <div>
          <label htmlFor="f-category" className="mb-1 block text-sm font-medium">Category</label>
          <select id="f-category" className="field" value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })}>
            {Array.from(new Set([...CATEGORIES, d.category])).map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {input("price", "Price (USD)", { type: "number", step: "0.01", min: "0" })}
          {input("stock", "Stock", { type: "number", step: "1", min: "0" })}
        </div>
        {input("image", "Image URL (optional)", { placeholder: "https://…" })}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary">{initial ? "Save changes" : "Add product"}</button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="surface relative w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <button className="btn btn-ghost !px-2" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
