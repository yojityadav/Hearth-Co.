import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";
import p7 from "@/assets/p7.jpg";
import p8 from "@/assets/p8.jpg";

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image: string;
};

export type CartItem = { productId: string; quantity: number };

export const LOW_STOCK_THRESHOLD = 5;
export const CATEGORIES = ["Home", "Electronics", "Accessories", "Stationery", "Footwear"];

const SEED: Product[] = [
  { id: "p1", name: "Sage Stoneware Mug", description: "Matte glazed ceramic, 350ml.", category: "Home", price: 18, stock: 24, image: p1 },
  { id: "p2", name: "Aria Wireless Headphones", description: "Noise cancelling, 30h battery.", category: "Electronics", price: 149, stock: 8, image: p2 },
  { id: "p3", name: "Canvas & Leather Tote", description: "Waxed canvas with leather base.", category: "Accessories", price: 79, stock: 3, image: p3 },
  { id: "p4", name: "Linen Notebook Set", description: "A5 hardcover with brass pen.", category: "Stationery", price: 32, stock: 40, image: p4 },
  { id: "p5", name: "Amber Soy Candle", description: "Cedar & vanilla, 45h burn.", category: "Home", price: 26, stock: 0, image: p5 },
  { id: "p6", name: "Everyday White Sneaker", description: "Full-grain leather, rubber sole.", category: "Footwear", price: 110, stock: 12, image: p6 },
  { id: "p7", name: "Pocket Bluetooth Speaker", description: "Water resistant, 12h playtime.", category: "Electronics", price: 59, stock: 4, image: p7 },
  { id: "p8", name: "Terracotta Succulent", description: "Live plant in a hand-thrown pot.", category: "Home", price: 22, stock: 15, image: p8 },
];

const KEY_PRODUCTS = "shop.products.v1";
const KEY_CART = "shop.cart.v1";
const KEY_VIEW = "shop.view.v1";

export type View = "store" | "admin";

type Ctx = {
  ready: boolean;
  products: Product[];
  cart: CartItem[];
  view: View;
  setView: (v: View) => void;
  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addToCart: (id: string) => string | null;
  setQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  checkout: () => { ok: true; orderId: string; total: number } | { ok: false; error: string };
  resetDemo: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>(SEED);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<View>("store");

  useEffect(() => {
    setProducts(read(KEY_PRODUCTS, SEED));
    setCart(read(KEY_CART, []));
    setView(read<View>(KEY_VIEW, "store"));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY_PRODUCTS, JSON.stringify(products));
  }, [products, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem(KEY_CART, JSON.stringify(cart));
  }, [cart, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem(KEY_VIEW, JSON.stringify(view));
  }, [view, ready]);

  // Keep cart consistent with inventory (deleted products / reduced stock)
  useEffect(() => {
    setCart((c) => {
      const next = c
        .map((i) => {
          const p = products.find((x) => x.id === i.productId);
          return p ? { ...i, quantity: Math.min(i.quantity, p.stock) } : null;
        })
        .filter((i): i is CartItem => !!i && i.quantity > 0);
      return JSON.stringify(next) === JSON.stringify(c) ? c : next;
    });
  }, [products]);

  const value = useMemo<Ctx>(() => {
    const find = (id: string) => products.find((p) => p.id === id);
    return {
      ready,
      products,
      cart,
      view,
      setView,
      addProduct: (p) => setProducts((ps) => [{ ...p, id: `p${Date.now()}` }, ...ps]),
      updateProduct: (id, patch) => setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p))),
      deleteProduct: (id) => setProducts((ps) => ps.filter((p) => p.id !== id)),
      addToCart: (id) => {
        const p = find(id);
        if (!p) return "Product not found";
        const inCart = cart.find((i) => i.productId === id)?.quantity ?? 0;
        if (inCart + 1 > p.stock) return p.stock === 0 ? "Out of stock" : `Only ${p.stock} available`;
        setCart((c) =>
          inCart ? c.map((i) => (i.productId === id ? { ...i, quantity: i.quantity + 1 } : i)) : [...c, { productId: id, quantity: 1 }],
        );
        return null;
      },
      setQuantity: (id, qty) => {
        const p = find(id);
        if (!p) return;
        const q = Math.max(0, Math.min(Math.floor(qty) || 0, p.stock));
        setCart((c) => (q === 0 ? c.filter((i) => i.productId !== id) : c.map((i) => (i.productId === id ? { ...i, quantity: q } : i))));
      },
      removeFromCart: (id) => setCart((c) => c.filter((i) => i.productId !== id)),
      checkout: () => {
        if (cart.length === 0) return { ok: false, error: "Your cart is empty." };
        for (const i of cart) {
          const p = find(i.productId);
          if (!p) return { ok: false, error: "An item in your cart is no longer available." };
          if (i.quantity > p.stock) return { ok: false, error: `Only ${p.stock} of "${p.name}" left in stock.` };
        }
        const total = cartTotals(cart, products).total;
        setProducts((ps) =>
          ps.map((p) => {
            const i = cart.find((x) => x.productId === p.id);
            return i ? { ...p, stock: p.stock - i.quantity } : p;
          }),
        );
        setCart([]);
        return { ok: true, orderId: `ORD-${Date.now().toString(36).toUpperCase()}`, total };
      },
      resetDemo: () => {
        setProducts(SEED);
        setCart([]);
      },
    };
  }, [ready, products, cart, view]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export const SHIPPING_FLAT = 6;
export const FREE_SHIPPING_OVER = 100;
export const TAX_RATE = 0.08;

export function cartTotals(cart: CartItem[], products: Product[]) {
  const subtotal = cart.reduce((s, i) => s + (products.find((p) => p.id === i.productId)?.price ?? 0) * i.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FLAT;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  return { subtotal, shipping, tax, total: subtotal + shipping + tax, count };
}

export const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export function stockStatus(stock: number) {
  if (stock <= 0) return { label: "Out of stock", tone: "out" as const };
  if (stock <= LOW_STOCK_THRESHOLD) return { label: `Only ${stock} left`, tone: "low" as const };
  return { label: "In stock", tone: "ok" as const };
}
