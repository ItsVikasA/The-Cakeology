// Client-side cart for guest (not-logged-in) checkout. Stored in localStorage
// and shaped to MIRROR the server cart object, so the Cart page and Redux
// reducers can consume it unchanged (cart._id, items[].productId.variants, etc.).
const KEY = 'guestCart';

const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
};
const write = (items) => localStorage.setItem(KEY, JSON.stringify(items));

// Returns the server-cart-shaped object Redux expects, or null when empty.
export const getGuestCart = () => {
    const items = read();
    if (!items.length) return null;
    const amount = items.reduce(
        (s, it) => s + (it.productId?.variants?.price?.amount || 0) * it.quantity, 0
    );
    const currency = items[0]?.productId?.variants?.price?.currency || 'INR';
    return { _id: 'guest', items, totalPrice: { amount, currency } };
};

export const guestCartCount = () => read().reduce((s, it) => s + it.quantity, 0);

export const addToGuestCart = (product, variant) => {
    const items = read();
    const itemId = `${product._id}_${variant._id}`;
    const existing = items.find((it) => it._id === itemId);
    const stock = typeof variant.stock === 'number' ? variant.stock : Infinity;

    if (existing) {
        if (existing.quantity < stock) existing.quantity += 1;
    } else {
        items.push({
            _id: itemId,
            productId: {
                _id: product._id,
                title: product.title,
                images: product.images || [],
                // Single matched variant, same shape the server aggregation returns.
                variants: {
                    _id: variant._id,
                    attribute: variant.attribute || {},
                    price: variant.price,
                    images: variant.images || [],
                    stock: variant.stock,
                },
            },
            variantId: variant._id,
            quantity: 1,
            price: variant.price,
        });
    }
    write(items);
    return getGuestCart();
};

export const incGuestItem = (itemId) => {
    const items = read();
    const it = items.find((i) => i._id === itemId);
    if (it) {
        const stock = typeof it.productId?.variants?.stock === 'number' ? it.productId.variants.stock : Infinity;
        if (it.quantity < stock) it.quantity += 1;
    }
    write(items);
    return getGuestCart();
};

export const decGuestItem = (itemId) => {
    let items = read();
    const it = items.find((i) => i._id === itemId);
    if (it) {
        it.quantity -= 1;
        if (it.quantity <= 0) items = items.filter((i) => i._id !== itemId);
    }
    write(items);
    return getGuestCart();
};

export const removeGuestItem = (itemId) => {
    write(read().filter((i) => i._id !== itemId));
    return getGuestCart();
};

export const clearGuestCart = () => localStorage.removeItem(KEY);

// Payload for the guest-order endpoint: just the identifiers + quantity.
export const guestOrderItems = () =>
    read().map((it) => ({ productId: it.productId._id, variantId: it.variantId, quantity: it.quantity }));
