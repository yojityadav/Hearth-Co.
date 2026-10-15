import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { StoreProvider, cartTotals, useStore } from "@/lib/store";
import { Storefront } from "@/components/Storefront";
import { CartPanel } from "@/components/CartPanel";
import { AdminPanel } from "@/components/AdminPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hearth & Co. — Shop & Inventory" },
      { name: "description", content: "A modern storefront with cart, checkout and a built-in inventory management panel." },
      { property: "og:title", content: "Hearth & Co. — Shop & Inventory" },
      { property: "og:description", content: "Browse thoughtful everyday goods and manage inventory in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <StoreProvider>
      <App />
    </StoreProvider>
  ),
});

type Toast = { id: number; msg: string; tone: "ok" | "error" };

function App() {
  const { view, setView, cart, products } = useStore();
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const count = cartTotals(cart, products).count;

  const notify = useCallback((msg: string, tone: "ok" | "error" = "ok") => {
    const id = ++nextId.current;
    setToasts((t) => [...t.slice(-2), { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <span className="font-display text-xl font-semibold">Hearth &amp; Co.</span>
          <div className="flex rounded-full border bg-card p-1" role="tablist" aria-label="Switch view">
            {(["store", "admin"] as const).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`btn rounded-full !px-4 !py-1.5 ${view === v ? "btn-primary" : "btn-ghost"}`}
              >
                {v === "store" ? "Store" : "Admin"}
              </button>
            ))}
          </div>
          <button className="btn btn-outline relative" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${count} items`}>
            <span aria-hidden>🛒</span>
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground">
                {count}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {view === "store" ? <Storefront notify={notify} /> : <AdminPanel notify={notify} />}
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Academic demo store · No real payments are processed · Data is saved in your browser
      </footer>

      <CartPanel open={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 ${
              t.tone === "error" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
