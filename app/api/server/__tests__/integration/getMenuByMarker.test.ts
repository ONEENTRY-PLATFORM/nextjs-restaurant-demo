/**
 * @jest-environment node
 *
 * Integration test — hits the live OneEntry backend for the `user_menu`
 * (referenced by `components/layout/header/nav/NavGroup.tsx`).
 *
 * Run via `npm run test:integration`.
 */
import { describe, expect, it } from '@jest/globals';

import { getMenuByMarker } from '../../menus/getMenuByMarker';

describe('integration: getMenuByMarker', () => {
  it('fetches the `user_menu` from the live OneEntry backend', async () => {
    const result = await getMenuByMarker('user_menu');
    expect(result.isError).toBe(false);
    expect(result.menu).toBeDefined();
    // A real OneEntry menu has a numeric id and a `pages` array (possibly empty).
    expect(typeof result.menu?.id).toBe('number');
    expect(Array.isArray(result.menu?.pages)).toBe(true);
  }, 15000);

  it('fetches the `bottom_web` menu (the footer nav)', async () => {
    const result = await getMenuByMarker('bottom_web');
    expect(result.isError).toBe(false);
    expect(result.menu).toBeDefined();
    expect(Array.isArray(result.menu?.pages)).toBe(true);
  }, 15000);

  it('returns isError=true for a non-existent menu marker', async () => {
    const result = await getMenuByMarker('definitely-not-a-real-menu-xyz123');
    expect(result.isError).toBe(true);
    expect(result.error).toBeDefined();
  }, 15000);
});
