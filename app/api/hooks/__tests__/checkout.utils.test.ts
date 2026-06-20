import { describe, expect, it } from '@jest/globals';
import type { IOrderPreviewResponse } from 'oneentry/dist/orders/ordersInterfaces';
import type { IAccountsEntity } from 'oneentry/dist/payments/paymentsInterfaces';

import { derivePreviewTotals, filterAllowedAccounts } from '../checkout.utils';

const account = (over: Partial<IAccountsEntity>): IAccountsEntity =>
  ({ identifier: 'x', isVisible: true, isUsed: true, ...over }) as IAccountsEntity;

const DELIVERY_ID = 1828;

describe('filterAllowedAccounts', () => {
  const cash = account({ identifier: 'cash' });
  const stripe = account({ identifier: 'stripe' });
  const hidden = account({ identifier: 'hidden', isVisible: false });
  const unused = account({ identifier: 'unused', isUsed: false });

  it('drops not-visible and not-used accounts', () => {
    expect(filterAllowedAccounts([cash, hidden, unused]).map(a => a.identifier)).toEqual(['cash']);
  });

  it('returns all visible accounts when the storage links none', () => {
    expect(filterAllowedAccounts([cash, stripe], new Set()).map(a => a.identifier)).toEqual([
      'cash',
      'stripe',
    ]);
  });

  it('intersects visible accounts with the storage-linked identifiers', () => {
    const result = filterAllowedAccounts([cash, stripe], new Set(['stripe']));
    expect(result.map(a => a.identifier)).toEqual(['stripe']);
  });

  it('handles undefined accounts gracefully', () => {
    expect(filterAllowedAccounts(undefined, new Set(['cash']))).toEqual([]);
  });
});

describe('derivePreviewTotals', () => {
  // Loose cast: derivePreviewTotals only reads id/price/quantity + the scalar totals.
  const base = (over: Record<string, unknown>): IOrderPreviewResponse =>
    ({
      totalSum: 0,
      totalSumWithDiscount: 0,
      currency: 'USD',
      orderPreview: [],
      bonusApplied: 0,
      totalDue: 0,
      ...over,
    }) as unknown as IOrderPreviewResponse;

  it('splits subtotal vs delivery by the delivery product id', () => {
    const totals = derivePreviewTotals(
      base({
        orderPreview: [
          { id: 10, price: 100, quantity: 2 },
          { id: 20, price: 50, quantity: 1 },
          { id: DELIVERY_ID, price: 15, quantity: 1 },
        ],
        totalSum: 265,
        totalSumWithDiscount: 265,
        totalDue: 265,
      }),
      DELIVERY_ID
    );
    expect(totals.subtotal).toBe(250);
    expect(totals.delivery).toBe(15);
  });

  it('derives discount and uses totalDue as the headline total', () => {
    const totals = derivePreviewTotals(
      base({ totalSum: 300, totalSumWithDiscount: 250, totalDue: 230, bonusApplied: 20 }),
      DELIVERY_ID
    );
    expect(totals.discount).toBe(50);
    expect(totals.total).toBe(230);
    expect(totals.bonusApplied).toBe(20);
    expect(totals.currency).toBe('USD');
  });

  it('clamps negative discount to 0 and tolerates an empty preview', () => {
    const totals = derivePreviewTotals(
      base({ totalSum: 100, totalSumWithDiscount: 120, orderPreview: [] }),
      DELIVERY_ID
    );
    expect(totals.discount).toBe(0);
    expect(totals.subtotal).toBe(0);
    expect(totals.delivery).toBe(0);
  });
});
