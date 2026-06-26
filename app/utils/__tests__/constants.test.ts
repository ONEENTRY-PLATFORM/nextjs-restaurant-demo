import { describe, expect, it } from '@jest/globals';

import { FORMS, isBookingStorageMarker } from '../constants';

describe('isBookingStorageMarker', () => {
  it('matches the canonical booking-order marker exactly', () => {
    expect(isBookingStorageMarker(FORMS.bookingOrder)).toBe(true);
  });

  it('matches any marker containing "booking" (case-insensitive substring)', () => {
    expect(isBookingStorageMarker('restaurant_booking')).toBe(true);
    expect(isBookingStorageMarker('BOOKING_2026')).toBe(true);
    expect(isBookingStorageMarker('table-Booking-form')).toBe(true);
  });

  it('routes delivery and other order storages to false', () => {
    expect(isBookingStorageMarker(FORMS.deliveryOrder)).toBe(false);
    expect(isBookingStorageMarker('delivery_order')).toBe(false);
    expect(isBookingStorageMarker('some_future_storage')).toBe(false);
  });

  it('returns false for empty / nullish markers', () => {
    expect(isBookingStorageMarker('')).toBe(false);
    expect(isBookingStorageMarker(null)).toBe(false);
    expect(isBookingStorageMarker(undefined)).toBe(false);
  });
});
