import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { registrar } from './analitica';

/**
 * El carrito vive en el navegador (localStorage) hasta que se convierte en
 * pedido. Guarda una foto liviana de cada pieza para pintar la lista sin pegar
 * a la API; el precio real lo recalcula el servidor al crear el pedido.
 */
export const useCarrito = create(
  persist(
    (set, get) => ({
      items: [],

      agregar: (producto, qty = 1) => {
        registrar('add_to_cart', { producto_id: producto.id });
        return set((estado) => {
          const existente = estado.items.find((i) => i.productId === producto.id);
          const tope = producto.stock ?? 10;
          if (existente) {
            return {
              items: estado.items.map((i) =>
                i.productId === producto.id ? { ...i, qty: Math.min(i.qty + qty, tope), stock: tope } : i,
              ),
            };
          }
          return {
            items: [
              ...estado.items,
              {
                productId: producto.id,
                slug: producto.slug,
                name: producto.name,
                price: producto.price,
                imageUrl: producto.image?.url ?? null,
                stock: tope,
                qty: Math.min(qty, tope),
              },
            ],
          };
        });
      },
      cambiarCantidad: (productId, qty) =>
        set((estado) => ({
          items: estado.items
            .map((i) => (i.productId === productId ? { ...i, qty: Math.max(0, Math.min(qty, i.stock ?? 10)) } : i))
            .filter((i) => i.qty > 0),
        })),

      quitar: (productId) => set((estado) => ({ items: estado.items.filter((i) => i.productId !== productId) })),

      vaciar: () => set({ items: [] }),

      cantidadTotal: () => get().items.reduce((n, i) => n + i.qty, 0),
      subtotal: () => get().items.reduce((n, i) => n + i.price * i.qty, 0),
    }),
    { name: 'petru-carrito', version: 1 },
  ),
);

/**
 * El HTML prerenderizado se genera sin carrito. Para no pintar "0" en el
 * servidor y "3" un instante después (y que React proteste por la hidratación),
 * los componentes preguntan esto y muestran el carrito recién montados.
 */
const nada = () => () => {};
export function useCarritoListo() {
  // En el servidor (prerender) devuelve false; en el cliente, true tras hidratar.
  return useSyncExternalStore(nada, () => true, () => false);
}
