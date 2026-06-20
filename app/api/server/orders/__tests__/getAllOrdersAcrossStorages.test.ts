import { describe, expect, it } from '@jest/globals';

// Imported from the pure constants module (not the fetcher) to avoid pulling the SDK/api chain — the
// fetcher re-exports this same function.
import { isBookingStorageMarker } from '@/app/utils/constants';

describe('isBookingStorageMarker', () => {
  it('matches the canonical booking storage marker', () => {
    expect(isBookingStorageMarker('booking_order')).toBe(true);
  });

  it('matches any marker containing "booking" (case-insensitive)', () => {
    expect(isBookingStorageMarker('Booking_Special')).toBe(true);
    expect(isBookingStorageMarker('table-booking')).toBe(true);
  });

  it('treats delivery / other order storages as non-booking', () => {
    expect(isBookingStorageMarker('delivery_order')).toBe(false);
    expect(isBookingStorageMarker('catering_order')).toBe(false);
  });

  it('is false for empty / nullish markers', () => {
    expect(isBookingStorageMarker('')).toBe(false);
    expect(isBookingStorageMarker(null)).toBe(false);
    expect(isBookingStorageMarker(undefined)).toBe(false);
  });
});
