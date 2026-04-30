import Image from 'next/image';
import Link from 'next/link';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import CartAddIcon from '@/components/icons/cart-add';
import HeartCardButton from '@/components/shared/HeartCardButton';
import { UsePrice } from '@/components/utils';

import CardAnimations from '../../animations/CardAnimations';
import CartButton from './CartButton';
import ProductImage from './ProductImage';

/**
 * Карточка продукта — 1:1 порт `.menu_item` из `static-html/index.html`.
 *
 * Структура (точно повторяет макет):
 *   - `<img>` (ProductImage)
 *   - `<div class="descr">` с `time / weight / rating (★ 5,0)`
 *   - `<p class="menu_item-title">`
 *   - `<div class="menu_items_btn">` с `counter (x1)` + cart SVG + цена
 *   - `<svg class="heart_card">` в правом верхнем углу (favorite)
 *   - прозрачный оверлей `<Link>` для клика-перехода на `/shop/product/[id]`
 *
 * Анимации сохранены через {@link CardAnimations}. Клик по избранному
 * обрабатывается отдельной absolute-кнопкой, лежащей поверх ссылки на всю
 * карточку, чтобы лайк продукта не уводил с навигацией.
 * @param   {object}          props            - Пропсы компонента.
 * @param   {IProductsEntity} props.product    - Сущность продукта OneEntry.
 * @param   {number}          props.index      - Индекс в гриде (для stagger-анимации).
 * @param   {IAttributeValues} props.dict       - Словарь (не используется — оставлен для парности API).
 * @param   {number}          props.pagesLimit - pagesLimit для анимации.
 * @returns {JSX.Element}                      JSX карточки.
 */
const ProductCard = ({
  product,
  index,
  pagesLimit,
}: {
  product: IProductsEntity;
  index: number;
  dict: IAttributeValues;
  pagesLimit: number;
}): JSX.Element => {
  const { id, attributeValues, localizeInfos } = product;
  const attrs = attributeValues ?? {};
  const title = localizeInfos?.title || '';

  // Строка descr (время · вес · рейтинг) — markers из set атрибутов `dish`
  // (проверено через inspect-api). Fallback на дефолты static-html, чтобы
  // карточка не выглядела пустой, если какой-то атрибут не задан.
  const timeRaw = attrs.cooking_time?.value as string | number | undefined;
  const time = timeRaw ? String(timeRaw) : '30-45 min';

  const weightRaw = attrs.weight?.value as string | number | undefined;
  const weight = weightRaw ? `${weightRaw} g` : '250 g';

  const ratingRaw = attrs.rating?.value as string | number | undefined;
  const rating = ratingRaw ? String(ratingRaw) : '5,0';

  // Цена
  const priceValue = (attrs.price?.value ?? product.price) as
    | number
    | undefined;
  const formattedPrice = priceValue
    ? UsePrice({ amount: priceValue as number })
    : '$14';

  return (
    <CardAnimations
      className="menu_item group"
      index={index}
      pagesLimit={pagesLimit}
    >
      <ProductImage attributes={attrs} alt={title} />

      <div className="descr">
        <p> {time}</p>
        <p>{weight}</p>
        <div className="rating">
          <Image
            className="rating_img"
            src="/images/icons/Star 16.svg"
            alt="star"
            width={16}
            height={16}
            style={{ width: 'auto', height: 'auto' }}
          />
          <p>{rating}</p>
        </div>
      </div>

      <p className="menu_item-title">{title}</p>

      <CartButton
        id={id}
        title={title}
        units={attrs.units_product?.value as number | undefined}
      >
        <p className="counter">x1</p>
        <CartAddIcon className="w-5 h-4.75 md:w-7.25 md:h-6.75" />
        <p className="text-base md:text-[22px]">{formattedPrice}</p>
      </CartButton>

      <HeartCardButton product={product} />

      <Link
        prefetch={true}
        href={'/shop/product/' + id}
        className="absolute left-0 top-0 z-0 flex size-full"
        aria-label={title}
      />
    </CardAnimations>
  );
};

export default ProductCard;
