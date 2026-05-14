/**
 * @jest-environment node
 *
 * Integration test — hits the live OneEntry backend for the delivery product
 * (`NEXT_PUBLIC_DELIVERY_PRODUCT_ID`, default `33`). The delivery product is
 * a permanent fixture in this project's OneEntry instance — it's the
 * cart-summary line for shipping.
 *
 * Run via `npm run test:integration`.
 */
import { describe, expect, it } from '@jest/globals';

import { getProductById } from '../../products/getProductById';

const DELIVERY_PRODUCT_ID = Number(process.env.NEXT_PUBLIC_DELIVERY_PRODUCT_ID ?? 33);

describe('integration: getProductById', () => {
  it(`fetches the delivery product (id=${DELIVERY_PRODUCT_ID}) from the live backend`, async () => {
    const result = await getProductById(DELIVERY_PRODUCT_ID);
    expect(result.isError).toBe(false);
    expect(result.product).toBeDefined();
    expect(result.product?.id).toBe(DELIVERY_PRODUCT_ID);
    // Every product carries an attributeValues map keyed by attribute marker.
    expect(typeof result.product?.attributeValues).toBe('object');
  }, 15000);

  it('returns isError=true with statusCode 404 for an obviously-bogus product id', async () => {
    const result = await getProductById(999_999_999);
    expect(result.isError).toBe(true);
    expect(result.error?.statusCode).toBe(404);
  }, 15000);
});
