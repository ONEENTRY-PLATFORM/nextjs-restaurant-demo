import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type * as ReservationEditStateModule from '@/components/reservation/reservationEditState';

type Module = typeof ReservationEditStateModule;

/**
 * loadFresh — synchronously loads a brand-new instance of the module under test
 * so the module-scoped `pending` slot is reset between tests.
 *
 * @returns The module exports with `pending=null`.
 */
const loadFresh = (): Module => {
  let mod!: Module;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('@/components/reservation/reservationEditState') as Module;
  });
  return mod;
};

const sample = {
  orderId: 42,
  formData: [{ marker: 'name', value: 'Bob' }] as never,
  paymentAccountIdentifier: 'stripe',
  formIdentifier: 'reservation_form',
};

describe('reservationEditState', () => {
  let mod: Module;

  beforeEach(() => {
    mod = loadFresh();
  });

  it('starts empty — consume returns null', () => {
    expect(mod.consumePendingReservationEdit()).toBeNull();
  });

  it('setPendingReservationEdit then consume returns the payload exactly once', () => {
    mod.setPendingReservationEdit(sample);
    expect(mod.consumePendingReservationEdit()).toBe(sample);
    // One-shot: the second consume sees the cleared state.
    expect(mod.consumePendingReservationEdit()).toBeNull();
  });

  it('setPendingReservationEdit(null) clears a previously set payload', () => {
    mod.setPendingReservationEdit(sample);
    mod.setPendingReservationEdit(null);
    expect(mod.consumePendingReservationEdit()).toBeNull();
  });

  it('overwrites the pending payload with the latest set call', () => {
    mod.setPendingReservationEdit(sample);
    const next = { ...sample, orderId: 99 };
    mod.setPendingReservationEdit(next);
    expect(mod.consumePendingReservationEdit()).toBe(next);
  });
});
