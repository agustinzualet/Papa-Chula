import { atom, computed } from 'nanostores';

/** @type {import('nanostores').WritableAtom<Array<{id: string, nombre: string, precio: number, qty: number}>>} */
export const cartItems = atom([]);

export const cartTotal = computed(cartItems, (items) =>
    items.reduce((sum, item) => sum + item.precio * item.qty, 0)
);

export const cartCount = computed(cartItems, (items) =>
    items.reduce((sum, item) => sum + item.qty, 0)
);

/**
 * @param {{ id: string, nombre: string, precio: number }} product
 */
export function addToCart(product) {
    const current = cartItems.get();
    const existing = current.find((i) => i.id === product.id);
    if (existing) {
        cartItems.set(
            current.map((i) =>
                i.id === product.id ? { ...i, qty: i.qty + 1 } : i
            )
        );
    } else {
        cartItems.set([...current, { ...product, qty: 1 }]);
    }
}

/**
 * @param {string} id
 */
export function removeFromCart(id) {
    const current = cartItems.get();
    const existing = current.find((i) => i.id === id);
    if (!existing) return;
    if (existing.qty === 1) {
        cartItems.set(current.filter((i) => i.id !== id));
    } else {
        cartItems.set(
            current.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i))
        );
    }
}

export function clearCart() {
    cartItems.set([]);
}
