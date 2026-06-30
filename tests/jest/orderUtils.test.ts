import { describe, expect, it } from '@jest/globals';
import type { IOrderByMarkerEntity } from 'oneentry/dist/orders/ordersInterfaces';

import { DELIVERY_PRODUCT_ID } from '@/app/utils/constants';
import {
  computeTotals,
  formatOrderNumber,
  HISTORY_STATUSES,
  isHistoryOrder,
  statusLabel,
} from '@/components/profile/orders/orderUtils';

/** Build a minimal IOrderByMarkerEntity for tests — only the fields the utils read. */
const order = (overrides: Partial<IOrderByMarkerEntity> = {}): IOrderByMarkerEntity =>
  ({
    id: 1,
    products: [],
    totalSum: 0,
    ...overrides,
  }) as unknown as IOrderByMarkerEntity;

describe('isHistoryOrder / HISTORY_STATUSES', () => {
  it.each(['delivered', 'canceled', 'cancelled', 'rejected'])(
    'recognises terminal status "%s" as history',
    status => {
      expect(isHistoryOrder(order({ statusIdentifier: status }))).toBe(true);
    }
  );

  it.each(['inProgress', 'reserved', 'pending', 'completed'])(
    'does NOT mark "%s" as history (avoids leaking active orders into history)',
    status => {
      expect(isHistoryOrder(order({ statusIdentifier: status }))).toBe(false);
    }
  );

  it('missing statusIdentifier counts as active (not history)', () => {
    expect(isHistoryOrder(order({}))).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isHistoryOrder(order({ statusIdentifier: 'DELIVERED' }))).toBe(true);
  });

  it('HISTORY_STATUSES is the exact whitelist (regression guard)', () => {
    expect([...HISTORY_STATUSES].sort()).toEqual(
      ['cancelled', 'canceled', 'delivered', 'rejected'].sort()
    );
  });
});

describe('statusLabel', () => {
  it('returns localized title when present', () => {
    const o = order({
      statusIdentifier: 'in_progress',
      statusLocalizeInfos: { title: 'В пути' },
    } as Partial<IOrderByMarkerEntity>);
    expect(statusLabel(o)).toBe('В пути');
  });

  it('humanises the identifier when no localized title', () => {
    const o = order({ statusIdentifier: 'in_progress' });
    expect(statusLabel(o)).toBe('In Progress');
  });

  it('returns "-" when nothing is set', () => {
    expect(statusLabel(order({}))).toBe('-');
  });
});

describe('formatOrderNumber', () => {
  it('prefers SDK-provided orderId (OE…)', () => {
    const o = order({ id: 99, orderId: 'OE-0042' } as unknown as Partial<IOrderByMarkerEntity>);
    expect(formatOrderNumber(o)).toBe('OE-0042');
  });

  it('falls back to the numeric id', () => {
    expect(formatOrderNumber(order({ id: 99 }))).toBe('99');
  });
});

describe('computeTotals', () => {
  it('splits subtotal vs delivery by DELIVERY_PRODUCT_ID', () => {
    const o = order({
      products: [
        { id: 1, price: 10, quantity: 2, title: 'A' },
        { id: 2, price: 5, quantity: 3, title: 'B' },
        { id: DELIVERY_PRODUCT_ID, price: 4, quantity: 1, title: 'Delivery' },
      ],
      totalSum: 39,
    } as unknown as Partial<IOrderByMarkerEntity>);
    const result = computeTotals(o);
    expect(result.subtotal).toBe(35);
    expect(result.delivery).toBe(4);
    expect(result.total).toBe(39);
    expect(result.discount).toBe(0);
  });

  it('discount = (subtotal + delivery) − serverTotal when a coupon shrank totalSum', () => {
    const o = order({
      products: [
        { id: 1, price: 10, quantity: 2, title: 'A' },
        { id: DELIVERY_PRODUCT_ID, price: 4, quantity: 1, title: 'Delivery' },
      ],
      totalSum: 20, // 24 − 4 discount
    } as unknown as Partial<IOrderByMarkerEntity>);
    const result = computeTotals(o);
    expect(result.subtotal).toBe(20);
    expect(result.delivery).toBe(4);
    expect(result.total).toBe(20);
    expect(result.discount).toBe(4);
  });

  it('falls back to subtotal+delivery when totalSum is missing', () => {
    const o = order({
      products: [{ id: 1, price: 7, quantity: 2, title: 'A' }],
      totalSum: 0,
    } as unknown as Partial<IOrderByMarkerEntity>);
    const result = computeTotals(o);
    expect(result.total).toBe(14);
    expect(result.discount).toBe(0);
  });

  it('handles empty products list', () => {
    expect(computeTotals(order({ products: [] }))).toEqual({
      subtotal: 0,
      delivery: 0,
      discount: 0,
      total: 0,
    });
  });
});
