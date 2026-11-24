import { describe, expect, it } from '@jest/globals';
import type { IOrderByMarkerEntity, IOrderProducts, IProductsEntity } from 'oneentry/types';

import { DELIVERY_PRODUCT_ID } from '@/app/utils/constants';
import {
  computeTotals,
  formatOrderNumber,
  HISTORY_STATUSES,
  isHistoryOrder,
  orderProductPreview,
  orderProductTitle,
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

/** Build a minimal IOrderProducts line item — only the fields the helpers read. */
const line = (overrides: Partial<IOrderProducts> = {}): IOrderProducts =>
  ({ id: 7, title: 'Soup', previewImage: null, ...overrides }) as unknown as IOrderProducts;

const pic = (previewLink: string) => ({
  filename: 'a.jpg',
  downloadLink: 'https://cdn/a.jpg',
  size: 1,
  previewLink,
});

describe('orderProductPreview', () => {
  it('reads previewLink of a single picture', () => {
    expect(orderProductPreview(line({ previewImage: pic('https://cdn/p.jpg') }))).toBe(
      'https://cdn/p.jpg'
    );
  });

  it('takes the first picture of an array', () => {
    expect(
      orderProductPreview(
        line({ previewImage: [pic('https://cdn/1.jpg'), pic('https://cdn/2.jpg')] })
      )
    ).toBe('https://cdn/1.jpg');
  });

  it('reads the http URL out of the object form the API actually sends', () => {
    const real = {
      filename: 'a.jpeg',
      downloadLink: 'https://cdn/a.jpeg',
      size: 1,
      previewLink: {
        preview: ['data:image/webp;base64,AAAA', 'https://cdn/a.preview.preview.jpeg'],
      },
    } as unknown as ReturnType<typeof pic>;
    expect(orderProductPreview(line({ previewImage: [real] }))).toBe(
      'https://cdn/a.preview.preview.jpeg'
    );
  });

  it('returns undefined when the object form holds no http URL', () => {
    const dataOnly = {
      ...pic(''),
      previewLink: { preview: ['data:image/webp;base64,AAAA'] },
    } as unknown as ReturnType<typeof pic>;
    expect(orderProductPreview(line({ previewImage: [dataOnly] }))).toBeUndefined();
  });

  it('returns undefined for an empty array, null or an empty link', () => {
    expect(orderProductPreview(line({ previewImage: [] }))).toBeUndefined();
    expect(orderProductPreview(line({ previewImage: null }))).toBeUndefined();
    expect(orderProductPreview(line({ previewImage: pic('') }))).toBeUndefined();
  });
});

describe('orderProductTitle', () => {
  const full = { localizeInfos: { title: 'Borscht' } } as unknown as IProductsEntity;

  it('prefers the line item title', () => {
    expect(orderProductTitle(line({ title: 'Soup' }), full)).toBe('Soup');
  });

  it('falls back to the full product title when the line item title is null', () => {
    expect(orderProductTitle(line({ title: null }), full)).toBe('Borscht');
  });

  it('returns an empty string when nothing is known', () => {
    expect(orderProductTitle(line({ title: null }))).toBe('');
  });
});
