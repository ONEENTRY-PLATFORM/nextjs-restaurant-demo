import Image from 'next/image';
import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import ClockCircleIcon from '@/components/icons/clock-circle';
import StarPuffyIcon from '@/components/icons/star-puffy';

import AddToCartButton from '../components/AddToCartButton';

/**
 * Панель деталей продукта — порт правой колонки `static-html/details.html`.
 * Поля (OneEntry, set атрибутов `dish`):
 *   - `weight` (integer) — граммы
 *   - `calorrage` (integer) — ккал
 *   - `rating` (float)
 *   - `cooking_time` (integer min)
 *   - `preferences` (list) — теги
 *   - `ingredients` (string)
 *   - `price` + `currency`
 * @param   {{product: IProductsEntity}} props - пропсы компонента
 * @returns {JSX.Element} JSX панели деталей продукта
 */
const ProductDetails = async ({ product }: { product: IProductsEntity }): Promise<JSX.Element> => {
  const {
    id,
    statusIdentifier,
    localizeInfos: { title },
    attributeValues: {
      weight,
      calorrage,
      rating,
      cooking_time,
      preferences,
      ingredients,
      price,
      currency,
    },
  } = product;

  const weightVal = weight?.value as number | undefined;
  const calorrageVal = calorrage?.value as number | undefined;
  const ratingVal = rating?.value as number | undefined;
  const cookingVal = cooking_time?.value as number | undefined;

  const prefs =
    (preferences?.value as Array<{ title: string; value: string }>)?.filter(
      o => o?.title && o?.value
    ) ?? [];

  const ingredientsText = ingredients?.value as string | undefined;
  const priceVal = price?.value as number | undefined;
  const currencyVal = (currency?.value as string | undefined) ?? 'USD';
  const priceFormatted =
    priceVal != null ? (currencyVal === 'USD' ? `$${priceVal}` : `${priceVal} ${currencyVal}`) : '';

  return (
    <div className="flex flex-col gap-3.75">
      {/* Ряд метрик + price badge — одной строкой по static-html/details.html:130 */}
      <div className="flex justify-between items-start gap-3.75 lg:flex-row-reverse">
        <div className="flex flex-col gap-3.75 mt-2.5">
          {/* Вес / калорийность / рейтинг + cooking_time (на мобиле) */}
          <div className="flex gap-1.25 md:gap-3.75 items-center">
            {weightVal != null ? (
              <>
                <Image src="/images/icons/weight.svg" alt="weight" width={27} height={20} />
                <p className="font-bold text-[12px] tracking-[0.02em] text-white opacity-90">
                  {weightVal} g
                </p>
              </>
            ) : null}
            {calorrageVal != null ? (
              <>
                <Image src="/images/icons/flame.svg" alt="flame" width={15} height={20} />
                <p className="font-bold text-[12px] tracking-[0.02em] text-white opacity-90">
                  {calorrageVal} ccal
                </p>
              </>
            ) : null}
            {ratingVal != null ? (
              <>
                <StarPuffyIcon />
                <p className="font-bold text-[12px] tracking-[0.02em] text-white opacity-90">
                  {ratingVal}
                </p>
              </>
            ) : null}
            {/* Cooking time — мобильный/планшетный вариант, в одном ряду с метриками */}
            {cookingVal != null && cookingVal > 0 ? (
              <div className="flex gap-1.25 items-center lg:hidden">
                <ClockCircleIcon variant="orange" />
                <p className="font-bold text-[12px] tracking-[0.02em] text-white opacity-90">
                  {cookingVal} min
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {priceFormatted ? (
          <div className="rounded-[10px] w-18 h-13 bg-custom-gradient flex justify-center items-center font-bold text-white text-[20px] shrink-0 mt-8.5 md:mt-0">
            {priceFormatted}
          </div>
        ) : null}
      </div>

      {/* Cooking time — десктопный вариант, отдельной строкой ниже (lg+) */}
      {cookingVal != null && cookingVal > 0 ? (
        <div className="hidden lg:flex gap-3.75 items-center mt-7.5">
          <ClockCircleIcon variant="orange" />
          <p className="font-bold text-[12px] tracking-[0.02em] text-white opacity-90">
            {cookingVal} min
          </p>
        </div>
      ) : null}

      {/* Ингредиенты */}
      {ingredientsText ? (
        <h3 className="font-normal text-[14px] tracking-[0.02em] text-white opacity-90">
          <span className="text-brand">Ingredients:</span> {ingredientsText}
        </h3>
      ) : null}

      {/* Preferences / теги — кликабельные пилюли, ведут на
          `/shop?preferences=<value>`. Тот же контракт, что и
          `CategoriesScroller` в шапке: повторный клик по активному чипу
          сбрасывает фильтр (логика — на стороне CategoriesScroller, тут
          ссылка простая). Стили `list_item`/`list_link` совпадают с
          верхним скроллером тегов. */}
      {prefs.length > 0 ? (
        <div className="flex flex-wrap gap-3.75">
          {prefs.map(p => (
            <Link
              key={p.value}
              href={'/shop?preferences=' + encodeURIComponent(p.value)}
              className="list_item list_link"
            >
              {p.title}
            </Link>
          ))}
        </div>
      ) : null}

      {/* CTA Add to cart */}
      <AddToCartButton
        id={id}
        units={0}
        statusIdentifier={statusIdentifier || ''}
        productTitle={title || ''}
        height={50}
        className="mt-2.5 w-full flex justify-center items-center gap-2.5 font-bold text-[20px] text-white uppercase py-4.5 bg-custom-gradient rounded-[10px] hover:bg-gradient-to-r-hover"
      />
    </div>
  );
};

export default ProductDetails;
