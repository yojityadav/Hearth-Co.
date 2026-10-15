import { useMemo, useState } from "react";
import { money, stockStatus, useStore, type Product } from "@/lib/store";
import { ProductImage } from "./ProductImage";

export function Storefront({ notify }: { notify: (msg: string, tone?: "ok" | "error") => void }) {
  const { products, ready, addToCart, cart } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.category))).sort()], [products]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) => (category === "All" || p.category === category) && (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
    );
  }, [products, query, category]);

  const handleAdd = (p: Product) => {
    const err = addToCart(p.id);
    notify(err ?? `Added "${p.name}" to cart`, err ? "error" : "ok");
  };

  return (
    <div>
      <section className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">New season</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-semibold">Thoughtful goods for everyday living</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">Free shipping on orders over $100.</p>
      </section>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="search"
          className="field md:max-w-sm"
          placeholder="Search products…"
          aria-label="Search products"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categories">
          {categories.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={`btn !py-1.5 !px-3.5 rounded-full ${category === c ? "btn-primary" : "btn-outline"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {!ready ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="surface overflow-hidden animate-pulse">
              <div className="aspect-square bg-muted" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/3 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface p-12 text-center">
          <h3 className="text-xl font-semibold">No products found</h3>
          <p className="mt-1 text-sm text-muted-foreground">Try a different search or category.</p>
          <button className="btn btn-outline mt-4" onClick={() => { setQuery(""); setCategory("All"); }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => {
            const s = stockStatus(p.stock);
            const inCart = cart.find((i) => i.productId === p.id)?.quantity ?? 0;
            const maxed = inCart >= p.stock;
            return (
              <article key={p.id} className="surface group flex flex-col overflow-hidden transition hover:-translate-y-0.5">
                <div className="relative overflow-hidden">
                  <ProductImage src={p.image} alt={p.name} className="aspect-square w-full transition duration-500 group-hover:scale-105" />
                  <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      s.tone === "out" ? "bg-destructive text-destructive-foreground" : s.tone === "low" ? "bg-warning text-foreground" : "bg-card/90 text-success"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.category}</p>
                  <h3 className="mt-1 font-sans text-base font-semibold leading-snug">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                    <span className="text-lg font-bold">{money(p.price)}</span>
                    <button className="btn btn-primary !px-3" disabled={p.stock === 0 || maxed} onClick={() => handleAdd(p)}>
                      {p.stock === 0 ? "Sold out" : maxed ? "Max in cart" : "Add to cart"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
