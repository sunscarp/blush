"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Cart = Record<string, number>;

type CartContextType = {
  cart: Cart;
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  totalItems: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({});

  const addItem = (id: string) => {
    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const removeItem = (id: string) => {
    setCart((prev) => {
      if (!prev[id]) return prev;

      const updated = { ...prev };

      if (updated[id] === 1) {
        delete updated[id];
      } else {
        updated[id] -= 1;
      }

      return updated;
    });
  };

  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <CartContext.Provider
      value={{ cart, addItem, removeItem, totalItems }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
