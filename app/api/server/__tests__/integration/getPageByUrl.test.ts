/**
 * @jest-environment node
 *
 * Integration test — hits the real OneEntry backend
 * (`process.env.NEXT_PUBLIC_ONEENTRY_URL`) using the real SDK and the
 * production app token. No SDK mocks are involved.
 *
 * Forced into the `node` test environment because the OneEntry SDK uses the
 * global `fetch`; jsdom intercepts cross-origin requests in ways that surface
 * as silently-empty responses here.
 *
 * Run only via `npm run test:integration` (see package.json) so the fast
 * unit-test loop is not coupled to network availability.
 */
import { describe, expect, it } from '@jest/globals';

import { getPageByUrl } from '../../pages/getPageByUrl';

describe('integration: getPageByUrl', () => {
  it('fetches the home page (`home_web`) from the live OneEntry backend', async () => {
    const result = await getPageByUrl('home_web');
    expect(result.isError).toBe(false);
    expect(result.page).toBeDefined();
    // A real OneEntry page always exposes a numeric id and the pageUrl marker.
    expect(typeof result.page?.id).toBe('number');
    expect(result.page?.pageUrl).toBe('home_web');
  }, 15000);

  it('returns isError=true with statusCode 404 for a non-existent pageUrl', async () => {
    const result = await getPageByUrl('definitely-not-a-real-page-xyz123');
    expect(result.isError).toBe(true);
    expect(result.error).toBeDefined();
    expect(result.error?.statusCode).toBe(404);
  }, 15000);
});
