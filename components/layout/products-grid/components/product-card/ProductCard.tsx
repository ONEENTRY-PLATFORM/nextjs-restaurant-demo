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
 * @param   {number}          props.productsLimit - productsLimit для анимации.
 * @returns {JSX.Element}                      JSX карточки.
 */
const ProductCard = ({
  product,
  index,
  productsLimit,
}: {
  product: IProductsEntity;
  index: number;
  dict: IAttributeValues;
  productsLimit: number;
}): JSX.Element => {
  const { id, attributeValues, localizeInfos } = product;
  const attrs = attributeValues ?? {};
  const title = localizeInfos?.title || '';

  const timeRaw = attrs.cooking_time?.value as string | number | undefined;
  const time = timeRaw != null && timeRaw !== '' ? String(timeRaw) : null;

  const weightRaw = attrs.weight?.value as string | number | undefined;
  const weight =
    weightRaw != null && weightRaw !== '' ? `${weightRaw} g` : null;

  const ratingRaw = attrs.rating?.value as string | number | undefined;
  const rating =
    ratingRaw != null && ratingRaw !== '' ? String(ratingRaw) : null;

  // Цена
  const priceValue = (attrs.price?.value ?? product.price) as
    | number
    | undefined;
  const formattedPrice =
    priceValue != null ? UsePrice({ amount: priceValue as number }) : null;

  return (
    <CardAnimations
      className="menu_item group"
      index={index}
      productsLimit={productsLimit}
    >
      <ProductImage attributes={attrs} alt={title} />

      {time || weight || rating ? (
        <div className="descr">
          {time ? <p> {time}</p> : null}
          {weight ? <p>{weight}</p> : null}
          {rating ? (
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
          ) : null}
        </div>
      ) : null}

      <p className="menu_item-title">{title}</p>

      <CartButton id={id} title={title}>
        <p className="counter">x1</p>
        <CartAddIcon className="w-5 h-4.75 md:w-7.25 md:h-6.75" />
        {formattedPrice ? (
          <p className="text-base md:text-[22px]">{formattedPrice}</p>
        ) : null}
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
