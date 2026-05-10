import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import ProductReviewsListServer from '@/components/reviews/ProductReviewsListServer';

import ProductAnimations from './animations/ProductAnimations';
import ProductCover from './product-single/ProductCover';
import ProductDetails from './product-single/ProductDetails';
import ProductsGroup from './ProductsGroup';
import RelatedItems from './RelatedItems';

type ProductPageLink = { categoryPath?: string };

type DishProduct = IProductsEntity & {
  blocks?: Array<string>;
  productPages?: ProductPageLink[];
};

/**
 * ProductSingle — single product page (cover + details + reviews + related).
 *
 * @param   {object}        props         - Component props.
 * @param   {DishProduct}   props.product - OneEntry product entity with `blocks` / `productPages`.
 * @returns JSX of the product page.
 */
const ProductSingle = async ({ product }: { product: DishProduct }): Promise<JSX.Element> => {
  const { id, localizeInfos, blocks, productPages, attributeValues } = product;

  // Parse "menu/desserts" -> "desserts"
  const categoryPath = productPages?.[0]?.categoryPath ?? '';
  const categorySlug = categoryPath.split('/').pop() ?? '';
  const categoryLabel = categorySlug
    ? categorySlug
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : '';

  const priceVal = attributeValues?.price?.value as number | undefined;
  const currencyVal = (attributeValues?.currency?.value as string | undefined) ?? 'USD';
  const priceFormatted =
    priceVal != null ? (currencyVal === 'USD' ? `$${priceVal}` : `${priceVal} ${currencyVal}`) : '';

  return (
    <section className="shop_section">
      {/* Breadcrumb + title - md+ above the columns */}
      <div className="hidden md:block">
        {categoryLabel ? (
          <Link
            href={'/shop/category/' + categorySlug}
            className="font-normal text-base text-muted-text hover:text-brand"
          >
            Category / {categoryLabel}
          </Link>
        ) : null}
        <p className="font-bold text-xl tracking-fine text-paper">{localizeInfos.title}</p>
      </div>

      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-15">
        <ProductAnimations
          className="relative -mx-4 block w-[calc(100%+2rem)] md:mx-auto md:w-full md:max-w-175 lg:mx-0 lg:min-w-153.75 lg:shrink-0"
          index={0}
        >
          <ProductCover alt={localizeInfos.title} product={product} />
        </ProductAnimations>

        {/* Details + reviews - col-2 */}
        <ProductAnimations className="flex w-full flex-col lg:min-w-0 lg:flex-1" index={1}>
          <div className="flex items-start justify-between gap-3.75 md:hidden">
            <div className="flex flex-col gap-2.5">
              {categoryLabel ? (
                <Link
                  href={'/shop/category/' + categorySlug}
                  className="font-normal text-base text-muted-text"
                >
                  Category / {categoryLabel}
                </Link>
              ) : null}
              <p className="font-bold text-xl tracking-fine text-paper">{localizeInfos.title}</p>
            </div>
            {priceFormatted ? (
              <div className="flex h-13 w-18 shrink-0 items-center justify-center rounded-panel bg-custom-gradient font-bold text-xl text-white">
                {priceFormatted}
              </div>
            ) : null}
          </div>

          <ProductDetails product={product} />

          <ProductReviewsListServer productId={product.id} />
        </ProductAnimations>
      </div>

      {/* blocks -> bulk-purchase offer ("multiply_items_offer") */}
      {Array.isArray(blocks) &&
        blocks.map((block: string) => {
          if (block === 'multiply_items_offer') {
            return <ProductsGroup key={block} marker={block} />;
          }
          return null;
        })}

      {/* Related items: canonical getRelatedProductsById, or fallback to a
          similar_products_block-style block from product.blocks */}
      <RelatedItems productId={id} {...(blocks ? { blocks } : {})} />
    </section>
  );
};

export default ProductSingle;
