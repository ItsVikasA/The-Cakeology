// Ordered fulfillment stages (excluding 'cancelled').
// placed = new/incoming order, confirmed = confirmed & being prepared,
// ready = ready for delivery or pickup.
export const STATUS_ORDER = ['placed', 'confirmed', 'ready'];

// Derives an overall order status from its per-item statuses:
// all cancelled -> 'cancelled'; otherwise the least-progressed active item.
export function computeOrderStatus(items = []) {
    const active = items.filter((i) => i.status !== 'cancelled');
    if (active.length === 0) return 'cancelled';
    let minIdx = STATUS_ORDER.length - 1;
    for (const it of active) {
        const idx = STATUS_ORDER.indexOf(it.status || 'placed');
        if (idx !== -1 && idx < minIdx) minIdx = idx;
    }
    return STATUS_ORDER[minIdx];
}
