import { describe, expect, it } from '@jest/globals';

import robots from '@/app/robots';
import { NON_CANONICAL_PARAMS } from '@/app/utils/shopCrawlMeta';

/** The `disallow` list of the wildcard rule, normalised to an array. */
const disallowList = (): string[] => {
  const rules = robots().rules;
  const list = Array.isArray(rules) ? rules : [rules];
  const wildcard = list.find(rule => rule.userAgent === '*');
  const disallow = wildcard?.disallow ?? [];
  return Array.isArray(disallow) ? disallow : [disallow];
};

/**
 * Minimal robots.txt matcher: patterns are prefix matches in which `*` stands for any run of
 * characters. Written out rather than mocked so the assertions below test the actual matching
 * semantics a crawler applies, not our description of them.
 */
const matches = (pattern: string, pathWithQuery: string): boolean => {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}`).test(pathWithQuery);
};

/** Whether any disallow pattern blocks the given path+query. */
const isBlocked = (pathWithQuery: string): boolean =>
  disallowList().some(pattern => matches(pattern, pathWithQuery));

describe('robots — catalog facets', () => {
  it('blocks every faceting parameter, on the root catalog and on category listings alike', () => {
    for (const param of NON_CANONICAL_PARAMS) {
      expect(isBlocked(`/shop?${param}=x`)).toBe(true);
      expect(isBlocked(`/shop/category/pizza?${param}=x`)).toBe(true);
    }
  });

  it('blocks a faceting parameter that is not the first in the query string', () => {
    expect(isBlocked('/shop?sort=price&search=spicy')).toBe(true);
  });

  it('derives one pattern per faceting parameter', () => {
    const facetPatterns = disallowList().filter(p => p.startsWith('/shop'));
    expect(facetPatterns).toHaveLength(NON_CANONICAL_PARAMS.length);
  });
});

describe('robots — what must stay crawlable', () => {
  it('leaves clean catalog, category and product URLs crawlable', () => {
    expect(isBlocked('/shop')).toBe(false);
    expect(isBlocked('/shop/category/pizza')).toBe(false);
    expect(isBlocked('/shop/product/123')).toBe(false);
  });

  /*
    The regression this replaced: `/shop/*?` blocked any query string under /shop, and products live
    at /shop/product/<id>. A link shared on Facebook arrives with `?fbclid=…` appended, so the product
    page became uncrawlable and its canonical was never read.
  */
  it('leaves a product URL carrying a tracking parameter crawlable', () => {
    expect(isBlocked('/shop/product/123?fbclid=abc123')).toBe(false);
    expect(isBlocked('/shop/product/123?utm_source=newsletter')).toBe(false);
    expect(isBlocked('/shop/category/pizza?utm_campaign=spring')).toBe(false);
  });

  it('still closes the private areas', () => {
    for (const path of ['/profile', '/cart', '/auth/', '/api/']) {
      expect(isBlocked(path)).toBe(true);
    }
  });
});
