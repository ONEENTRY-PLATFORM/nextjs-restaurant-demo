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
 * Страница одного продукта — порт `static-html/details.html`. Двухколоночный layout
 * (md+): большая картинка слева (контейнер фиксированной аспектной высоты),
 * правая панель с метаданными, ингредиентами, тегами, кнопкой Add-to-cart и
 * блоком отзывов с pager-стрелками (`ProductReviewsListServer`). Сверху над
 * колонками — breadcrumb «Category / X» и название блюда. Под колонками —
 * trailing-секция «Featured objects» через `RelatedItems` блок.
 * @param   {object}                                       props         - пропсы
 * @param   {DishProduct}                                  props.product - продукт
 * @returns {Promise<JSX.Element>}                                       JSX страницы продукта
 */
const ProductSingle = async ({ product }: { product: DishProduct }): Promise<JSX.Element> => {
  const { id, localizeInfos, blocks, productPages } = product;

  // Парсим "menu/desserts" → "desserts"
  const categoryPath = productPages?.[0]?.categoryPath ?? '';
  const categorySlug = categoryPath.split('/').pop() ?? '';
  const categoryLabel = categorySlug
    ? categorySlug
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : '';

  return (
    <section className="shop_section">
      {/* Breadcrumb + заголовок — md+ над колонками */}
      <div className="hidden md:block">
        {categoryLabel ? (
          <Link
            href={'/shop/category/' + categorySlug}
            className="font-normal text-[16px] text-muted-text"
          >
            Category / {categoryLabel}
          </Link>
        ) : null}
        <p className="font-bold text-[20px] tracking-[0.02em] text-paper">{localizeInfos.title}</p>
      </div>

      {/* lg+ — flex-row (картинка | детали + отзывы), md и ниже — вертикальный стек.
          Размеры по static-html/pk_product_details.html: картинка 615-700px на lg+,
          gap 60px горизонтальный (lg+) / 20px вертикальный (mobile/md). */}
      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-15">
        {/* Картинка — col-1 */}
        <ProductAnimations
          className="relative mx-auto block w-full max-w-112.5 md:max-w-175 lg:mx-0 lg:min-w-153.75 lg:shrink-0"
          index={0}
        >
          <ProductCover alt={localizeInfos.title} product={product} />
        </ProductAnimations>

        {/* Детали + отзывы — col-2 */}
        <ProductAnimations className="flex w-full flex-col lg:min-w-0 lg:flex-1" index={1}>
          {/* Только для мобильной версии — категория + заголовок (над деталями на маленьких экранах) */}
          <div className="flex flex-col gap-2.5 md:hidden">
            {categoryLabel ? (
              <Link
                href={'/shop/category/' + categorySlug}
                className="font-normal text-[16px] text-muted-text"
              >
                Category / {categoryLabel}
              </Link>
            ) : null}
            <p className="font-bold text-[20px] tracking-[0.02em] text-paper">
              {localizeInfos.title}
            </p>
          </div>

          <ProductDetails product={product} />

          {/* Reviews — внутри правой колонки, как в static-html/details.html.
              Кнопка «Leave a review» в шапке блока открывает попап
              {@link ReviewFormPopup} (зарегистрирован в `app/layout.tsx`). */}
          <ProductReviewsListServer productId={product.id} />
        </ProductAnimations>
      </div>

      {/* blocks → оффер оптовой покупки ("multiply_items_offer") */}
      {Array.isArray(blocks) &&
        blocks.map((block: string) => {
          if (block === 'multiply_items_offer') {
            return <ProductsGroup key={block} marker={block} />;
          }
          return null;
        })}

      {/* Похожие товары: канонический getRelatedProductsById или
          fallback на блок типа similar_products_block из product.blocks */}
      <RelatedItems productId={id} {...(blocks ? { blocks } : {})} />
    </section>
  );
};

export default ProductSingle;
