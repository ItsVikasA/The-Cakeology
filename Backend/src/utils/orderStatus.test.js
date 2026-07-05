import { describe, it, expect } from 'vitest';
import { computeOrderStatus } from './orderStatus.js';

describe('computeOrderStatus', () => {
    it('returns "placed" for a single placed item', () => {
        expect(computeOrderStatus([{ status: 'placed' }])).toBe('placed');
    });

    it('returns the least-progressed active status across items', () => {
        const items = [{ status: 'ready' }, { status: 'confirmed' }, { status: 'placed' }];
        expect(computeOrderStatus(items)).toBe('placed');
    });

    it('treats missing status as "placed"', () => {
        expect(computeOrderStatus([{ status: 'ready' }, {}])).toBe('placed');
    });

    it('ignores cancelled items when others are active', () => {
        const items = [{ status: 'cancelled' }, { status: 'confirmed' }];
        expect(computeOrderStatus(items)).toBe('confirmed');
    });

    it('returns "cancelled" only when every item is cancelled', () => {
        expect(computeOrderStatus([{ status: 'cancelled' }, { status: 'cancelled' }])).toBe('cancelled');
    });

    it('returns "ready" when all active items are ready', () => {
        const items = [{ status: 'ready' }, { status: 'ready' }, { status: 'cancelled' }];
        expect(computeOrderStatus(items)).toBe('ready');
    });

    it('returns "cancelled" for an empty item list', () => {
        expect(computeOrderStatus([])).toBe('cancelled');
    });
});
