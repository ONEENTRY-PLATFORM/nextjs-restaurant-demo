/**
 * @jest-environment node
 *
 * Integration test — hits the live OneEntry backend for the `contact_us` form
 * (the only form marker referenced from the app codebase).
 *
 * Run via `npm run test:integration`.
 */
import { describe, expect, it } from '@jest/globals';

import { getFormByMarker } from '../../forms/getFormByMarker';

describe('integration: getFormByMarker', () => {
  it('fetches the `contact_us` form from the live OneEntry backend', async () => {
    const result = await getFormByMarker('contact_us');
    expect(result.isError).toBe(false);
    expect(result.form).toBeDefined();
    // A real OneEntry form always carries an id and (for the contact_us form)
    // the same marker we asked for. We do NOT assert on the specific field
    // shape — that's tied to the admin schema and will drift.
    expect(typeof result.form?.id).toBe('number');
    // OneEntry sometimes prefixes form identifiers (e.g. `form_contact_us`), so
    // we assert "contains" rather than equality — the marker we requested must
    // appear in whatever identifier the SDK returns.
    expect(typeof result.form?.identifier).toBe('string');
    expect(result.form?.identifier).toContain('contact_us');
  }, 15000);

  it('returns isError=true with statusCode 404 for a non-existent form marker', async () => {
    const result = await getFormByMarker('definitely-not-a-real-form-xyz123');
    expect(result.isError).toBe(true);
    expect(result.error?.statusCode).toBe(404);
  }, 15000);
});
