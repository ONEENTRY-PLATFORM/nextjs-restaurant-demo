import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';

import { isFilteredShopView, shopCrawlMeta } from '@/app/utils/shopCrawlMeta';

describe('isFilteredShopView', () => {
  it('returns false when searchParams is undefined', () => {
    expect(isFilteredShopView(undefined)).toBe(false);
  });

  it('returns false for an empty map (bare canonical listing)', () => {
    expect(isFilteredShopView({})).toBe(false);
  });

  it('returns true when a search term is present', () => {
    expect(isFilteredShopView({ search: 'pizza' })).toBe(true);
  });

  it.each([['preferences'], ['filter'], ['minPrice'], ['maxPrice'], ['cooking_time_max']])(
    'returns true when "%s" is set',
    key => {
      expect(isFilteredShopView({ [key]: 'x' })).toBe(true);
    }
  );

  it('ignores empty-string and nullish values', () => {
    expect(isFilteredShopView({ search: '' })).toBe(false);
    expect(isFilteredShopView({ search: undefined })).toBe(false);
  });

  it('treats an empty array value as canonical, a non-empty one as filtered', () => {
    expect(isFilteredShopView({ preferences: [] })).toBe(false);
    expect(isFilteredShopView({ preferences: ['Meat'] })).toBe(true);
  });

  it('treats page=1 (or below) as canonical but page>1 as filtered', () => {
    expect(isFilteredShopView({ page: '1' })).toBe(false);
    expect(isFilteredShopView({ page: '0' })).toBe(false);
    expect(isFilteredShopView({ page: '2' })).toBe(true);
    expect(isFilteredShopView({ page: ['3'] })).toBe(true);
  });

  it('ignores unknown (non-faceting) params', () => {
    expect(isFilteredShopView({ utm_source: 'newsletter', sort: 'price' })).toBe(false);
  });
});

describe('shopCrawlMeta', () => {
  const ORIGINAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_SITE_URL;
  });

  it('indexes the bare canonical listing of a visible page', () => {
    const meta = shopCrawlMeta({ searchParams: {}, canonicalPath: '/shop/category/pizza' });
    expect(meta.robots).toEqual({
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    });
  });

  it('de-indexes a filtered variant but still follows links', () => {
    const meta = shopCrawlMeta({
      searchParams: { page: '2' },
      canonicalPath: '/shop/category/pizza',
    });
    expect(meta.robots).toEqual({
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    });
  });

  it('de-indexes even the bare listing when the CMS page is not visible', () => {
    const meta = shopCrawlMeta({
      searchParams: {},
      canonicalPath: '/shop/category/pizza',
      isVisible: false,
    });
    expect(meta.robots).toMatchObject({ index: false });
  });

  it('canonicalises every variant to the clean path on the configured base URL', () => {
    const filtered = shopCrawlMeta({
      searchParams: { search: 'spicy', page: '3' },
      canonicalPath: '/shop/category/pizza',
    });
    expect(filtered.alternates?.canonical).toBe('https://example.com/shop/category/pizza');
  });

  it('falls back to localhost when NEXT_PUBLIC_SITE_URL is unset', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const meta = shopCrawlMeta({ searchParams: {}, canonicalPath: '/shop' });
    expect(meta.alternates?.canonical).toBe('http://localhost:3000/shop');
  });
});
