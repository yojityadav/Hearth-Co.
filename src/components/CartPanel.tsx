import { useState, type FormEvent } from "react";
import { cartTotals, money, useStore, FREE_SHIPPING_OVER } from "@/lib/store";
import { ProductImage } from "./ProductImage";

type Step = "cart" | "checkout" | "done";
type Form = { name: string; email: string; address: string; city: string; zip: string; card: string };
const EMPTY: Form = { name: "", email: "", address: "", city: "", zip: "", card: "" };

function validate(f: Form) {
  const e: Partial<Record<keyof Form, string>> = {};
  if (f.name.trim().length < 2) e.name = "Enter your full name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Enter a valid email";
  if (f.address.trim().length < 5) e.address = "Enter a street address";
  if (f.city.trim().length < 2) e.city = "Enter a city";
  if (!/^[A-Za-z0-9 -]{3,10}$/.test(f.zip.trim())) e.zip = "Enter a valid postal code";
  if (!/^\d{16}$/.test(f.card.replace(/\s/g, ""))) e.card = "Enter a 16-digit card number (demo only)";
  return e;
}

export function CartPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cart, products, setQuantity, removeFromCart, checkout } = useStore();
  const [step, setStep] = useState<Step>("cart");
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<{ id: string; total: number; email: string } | null>(null);
  const t = cartTotals(cart, products);

  const close = () => {
    onClose();
    if (step === "done") { setStep("cart"); setOrder(null); }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    setSubmitError("");
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    setTimeout(() => {
      const res = checkout();
      setSubmitting(false);
      if (!res.ok) { setSubmitError(res.error); return; }
      setOrder({ id: res.orderId, total: res.total, email: form.email });
      setForm(EMPTY);
      setStep("done");
    }, 700);
  };

  const fieldProps = (k: keyof Form) => ({
    id: k,
    value: form[k],
    "aria-invalid": !!errors[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }),
    className: "field",
  });

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-foreground/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={close} />
      <aside
        role="dialog"
        aria-label="Shopping cart"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <header className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-xl font-semibold">{step === "cart" ? `Your cart (${t.count})` : step === "checkout" ? "Checkout" : "Order confirmed"}</h2>
          <button className="btn btn-ghost !px-2" onClick={close} aria-label="Close cart">✕</button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === "done" && order ? (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success text-2xl text-primary-foreground">✓</div>
              <h3 className="mt-4 text-2xl font-semibold">Thank you!</h3>
              <p className="mt-2 text-sm text-muted-foreground">Order <strong className="text-foreground">{order.id}</strong> was placed successfully.</p>
              <p className="text-sm text-muted-foreground">Total charged (simulated): {money(order.total)}</p>
              <p className="mt-1 text-sm text-muted-foreground">A confirmation would be sent to {order.email}.</p>
              <button className="btn btn-primary mt-6" onClick={close}>Continue shopping</button>
            </div>
          ) : cart.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl">🛍️</p>
              <h3 className="mt-3 text-lg font-semibold">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground">Add some products to get started.</p>
              <button className="btn btn-outline mt-4" onClick={close}>Browse products</button>
            </div>
          ) : step === "cart" ? (
            <ul className="divide-y">
              {cart.map((i) => {
                const p = products.find((x) => x.id === i.productId);
                if (!p) return null;
                return (
                  <li key={i.productId} className="flex gap-3 py-4">
                    <ProductImage src={p.image} alt={p.name} className="h-20 w-20 shrink-0 rounded-lg" />
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-2">
                        <p className="font-semibold leading-snug">{p.name}</p>
                        <p className="font-semibold">{money(p.price * i.quantity)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{money(p.price)} each · {p.stock} available</p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center rounded-md border">
                          <button className="btn btn-ghost !px-3 !py-1" aria-label="Decrease quantity" onClick={() => setQuantity(p.id, i.quantity - 1)}>−</button>
                          <input
                            className="w-10 bg-transparent text-center text-sm font-semibold outline-none"
                            aria-label="Quantity"
                            inputMode="numeric"
                            value={i.quantity}
                            onChange={(e) => setQuantity(p.id, Number(e.target.value.replace(/\D/g, "")) || 1)}
                          />
                          <button className="btn btn-ghost !px-3 !py-1" aria-label="Increase quantity" disabled={i.quantity >= p.stock} onClick={() => setQuantity(p.id, i.quantity + 1)}>+</button>
                        </div>
                        <button className="text-xs font-semibold text-destructive hover:underline" onClick={() => removeFromCart(p.id)}>Remove</button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <form id="checkout-form" onSubmit={submit} noValidate className="space-y-3">
              {([
                ["name", "Full name", "text"],
                ["email", "Email", "email"],
                ["address", "Street address", "text"],
              ] as const).map(([k, label, type]) => (
                <div key={k}>
                  <label htmlFor={k} className="mb-1 block text-sm font-medium">{label}</label>
                  <input type={type} {...fieldProps(k)} />
                  {errors[k] && <p className="mt-1 text-xs text-destructive">{errors[k]}</p>}
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                {(["city", "zip"] as const).map((k) => (
                  <div key={k}>
                    <label htmlFor={k} className="mb-1 block text-sm font-medium">{k === "city" ? "City" : "Postal code"}</label>
                    <input {...fieldProps(k)} />
                    {errors[k] && <p className="mt-1 text-xs text-destructive">{errors[k]}</p>}
                  </div>
                ))}
              </div>
              <div>
                <label htmlFor="card" className="mb-1 block text-sm font-medium">Card number</label>
                <input inputMode="numeric" placeholder="4242 4242 4242 4242" maxLength={19} {...fieldProps("card")} />
                {errors.card && <p className="mt-1 text-xs text-destructive">{errors.card}</p>}
                <p className="mt-1 text-xs text-muted-foreground">Demo checkout — no real payment is processed.</p>
              </div>
              {submitError && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{submitError}</p>}
            </form>
          )}
        </div>

        {step !== "done" && cart.length > 0 && (
          <footer className="space-y-2 border-t px-5 py-4 text-sm">
            <Row label="Subtotal" value={money(t.subtotal)} />
            <Row label="Shipping" value={t.shipping === 0 ? "Free" : money(t.shipping)} />
            <Row label="Tax (8%)" value={money(t.tax)} />
            {t.shipping > 0 && <p className="text-xs text-muted-foreground">Add {money(FREE_SHIPPING_OVER - t.subtotal)} more for free shipping.</p>}
            <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Total</span><span>{money(t.total)}</span></div>
            {step === "cart" ? (
              <button className="btn btn-accent w-full !py-3" onClick={() => setStep("checkout")}>Proceed to checkout</button>
            ) : (
              <div className="flex gap-2">
                <button className="btn btn-outline" onClick={() => setStep("cart")}>Back</button>
                <button type="submit" form="checkout-form" className="btn btn-accent flex-1 !py-3" disabled={submitting}>
                  {submitting ? "Placing order…" : `Place order · ${money(t.total)}`}
                </button>
              </div>
            )}
          </footer>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-muted-foreground"><span>{label}</span><span className="text-foreground">{value}</span></div>;
}
