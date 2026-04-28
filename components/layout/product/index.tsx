import Link from 'next/link';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import ProductReviewsListServer from '@/components/reviews/ProductReviewsListServer';

import ProductAnimations from './animations/ProductAnimations';
import ProductDetails from './product-single/ProductDetails';
import ProductImage from './product-single/ProductImageGallery';
import ProductsGroup from './ProductsGroup';
import RelatedItems from './RelatedItems';

type ProductPageLink = { categoryPath?: string };

type DishProduct = IProductsEntity & {
  blocks?: Array<string>;
  productPages?: ProductPageLink[];
};

/**
 * Product single — порт `static-html/details.html`. Двухколоночный layout
 * (md+): большая картинка слева (контейнер фиксированной аспектной высоты),
 * правая панель с метаданными, ингредиентами, тегами, кнопкой Add-to-cart и
 * блоком отзывов с pager-стрелками (`ProductReviewsListServer`). Сверху над
 * колонками — breadcrumb «Category / X» и название блюда. Под колонками —
 * trailing-секция «Featured objects» через `RelatedItems` блок.
 * @param   {object}                                       props         - props
 * @param   {DishProduct}                                  props.product - продукт
 * @param   {IAttributeValues}                             props.dict    - словарь
 * @returns {Promise<JSX.Element>}                                       Product page JSX
 */
const ProductSingle = async ({
  product,
  dict,
}: {
  product: DishProduct;
  dict: IAttributeValues;
}): Promise<JSX.Element> => {
  const { id, localizeInfos, blocks, productPages } = product;

  // Parse "menu/desserts" → "desserts"
  const categoryPath = productPages?.[0]?.categoryPath ?? '';
  const categorySlug = categoryPath.split('/').pop() ?? '';
  const categoryLabel = categorySlug
    ? categorySlug
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : '';

  return (
    <section className="relative mx-auto box-border flex w-full md:max-w-175 lg:max-w-250 xl:max-w-323 shrink-0 grow flex-col self-stretch px-4">
      {/* Breadcrumb + title — md+ above the columns */}
      <div className="hidden md:block">
        {categoryLabel ? (
          <Link
            href={'/shop/category/' + categorySlug}
            className="font-normal text-[16px] text-[#969696]"
          >
            Category / {categoryLabel}
          </Link>
        ) : null}
        <p className="font-bold text-[20px] tracking-[0.02em] text-paper">
          {localizeInfos.title}
        </p>
      </div>

      {/* 2-column layout (md+): image | details + reviews */}
      <div className="lg:flex lg:justify-between md:gap-15 md:mt-5">
        {/* Image — col-1 */}
        <ProductAnimations
          className="relative mx-auto block w-full max-w-112.5 md:max-w-175 lg:min-w-153.75 lg:max-w-153.75 lg:shrink-0"
          index={0}
        >
          <ProductImage alt={localizeInfos.title} product={product} />
        </ProductAnimations>

        {/* Details + reviews — col-2 */}
        <ProductAnimations className="flex min-w-0 flex-1 flex-col" index={1}>
          {/* Mobile-only category + title (above details on small screens) */}
          <div className="mt-5 flex flex-col gap-2.5 md:hidden">
            {categoryLabel ? (
              <Link
                href={'/shop/category/' + categorySlug}
                className="font-normal text-[16px] text-[#969696]"
              >
                Category / {categoryLabel}
              </Link>
            ) : null}
            <p className="font-bold text-[20px] tracking-[0.02em] text-paper">
              {localizeInfos.title}
            </p>
          </div>

          <ProductDetails product={product} dict={dict} />

          {/* Reviews — внутри правой колонки, как в static-html/details.html */}
          <ProductReviewsListServer productId={product.id} />
        </ProductAnimations>
      </div>

      {/* blocks → bulk-purchase offer ("multiply_items_offer") */}
      {Array.isArray(blocks) &&
        blocks.map((block: string) => {
          if (block === 'multiply_items_offer') {
            return <ProductsGroup key={block} marker={block} dict={dict} />;
          }
          return null;
        })}

      {/* Похожие товары: канонический getRelatedProductsById или
          fallback на блок типа similar_products_block из product.blocks */}
      <RelatedItems
        productId={id}
        {...(blocks ? { blocks } : {})}
        dict={dict}
      />
    </section>
  );
};

export default ProductSingle;
