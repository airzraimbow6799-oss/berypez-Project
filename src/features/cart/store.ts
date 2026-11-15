"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import {
  addLine,
  type CartLine,
  type CartLineInput,
  parseStoredLines,
  removeLine,
  setQuantity,
} from "./cart";

type CartState = {
  lines: CartLine[];
  add: (input: CartLineInput, quantity: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

/** localStorage que no rompe la página si está bloqueado (modo privado, cuota llena). */
const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // Sin almacenamiento: el carrito vive solo en esta pestaña.
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Igual que arriba.
    }
  },
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (input, quantity) => set((state) => ({ lines: addLine(state.lines, input, quantity) })),
      setQuantity: (key, quantity) =>
        set((state) => ({ lines: setQuantity(state.lines, key, quantity) })),
      remove: (key) => set((state) => ({ lines: removeLine(state.lines, key) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "berypez:carrito",
      version: 1,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({ lines: state.lines }),
      // Lo guardado puede venir corrupto o de una versión vieja: se valida al leerlo.
      merge: (persisted, current) => ({
        ...current,
        lines: parseStoredLines((persisted as { lines?: unknown } | undefined)?.lines),
      }),
    },
  ),
);
