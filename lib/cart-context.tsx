"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/lib/products/storefront";

export type CartItem = {
  productId: string;
  /** Module 6 (Inventory), Phase 3 — the line's real identity (see
   *  lineKey below). Resolved and validated by AddToBag before an item
   *  can ever be added; never trusted as-is at checkout — createOrder
   *  re-fetches and re-validates every variant fresh. */
  variantId: string;
  slug: string;
  name: string;
  code: string;
  price: number;
  tone: string;
  icon: Product["icon"];
  /** Display snapshots only, taken from the resolved variant at
   *  add-to-cart time — null for a product with no size/color dimension
   *  (the single default/legacy variant). Not re-validated client-side;
   *  variantId is what checkout actually resolves against. */
  size: string | null;
  color: string | null;
  quantity: number;
};

/** Uniquely identifies a line. variantId alone is already
 *  globally unique (Module 6 Phase 3) — no need to combine it with
 *  productId the way the old productId+size key had to. */
function lineKey(item: Pick<CartItem, "variantId">) {
  return item.variantId;
}

type CartState = {
  items: CartItem[];
  hydrated: boolean;
};

type CartAction =
  | { type: "ADD"; item: Omit<CartItem, "quantity">; quantity: number }
  | { type: "REMOVE"; variantId: string }
  | { type: "SET_QUANTITY"; variantId: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.items, hydrated: true };

    case "ADD": {
      const key = lineKey(action.item);
      const existing = state.items.find((i) => lineKey(i) === key);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            lineKey(i) === key ? { ...i, quantity: i.quantity + action.quantity } : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.item, quantity: action.quantity }],
      };
    }

    case "REMOVE":
      return {
        ...state,
        items: state.items.filter((i) => lineKey(i) !== lineKey({ variantId: action.variantId })),
      };

    case "SET_QUANTITY": {
      const key = lineKey({ variantId: action.variantId });
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => lineKey(i) !== key) };
      }
      return {
        ...state,
        items: state.items.map((i) => (lineKey(i) === key ? { ...i, quantity: action.quantity } : i)),
      };
    }

    case "CLEAR":
      return { ...state, items: [] };

    default:
      return state;
  }
}

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  itemCount: number;
  subtotal: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "mono:cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], hydrated: false });
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  // Hydrate from localStorage once, on mount (client only — avoids SSR mismatch).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      dispatch({ type: "HYDRATE", items: raw ? JSON.parse(raw) : [] });
    } catch {
      dispatch({ type: "HYDRATE", items: [] });
    }
  }, []);

  // Persist on every change, once hydrated (prevents wiping storage with an empty initial state).
  useEffect(() => {
    if (!state.hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // Storage unavailable (private browsing, quota) — cart still works in-memory for this session.
    }
  }, [state.items, state.hydrated]);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const value: CartContextValue = {
    items: state.items,
    hydrated: state.hydrated,
    itemCount,
    subtotal,
    isDrawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    addItem: (item, quantity = 1) => dispatch({ type: "ADD", item, quantity }),
    removeItem: (variantId) => dispatch({ type: "REMOVE", variantId }),
    setQuantity: (variantId, quantity) => dispatch({ type: "SET_QUANTITY", variantId, quantity }),
    clearCart: () => dispatch({ type: "CLEAR" }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
