import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import ClockCircleIcon from '@/components/icons/clock-circle';
import FlameIcon from '@/components/icons/flame.svg';
import StarPuffyIcon from '@/components/icons/star-puffy';
import WeightIcon from '@/components/icons/weight.svg';

import AddToCartButton from '../components/AddToCartButton';

/**
 * Product details panel — порт правой колонки `static-html/details.html`.
 *
 * Не рендерит category/title — их выводит `ProductSingle` сверху над колонками
 * (мобильный заголовок) и в shared header-блоке (md+).
 *
 * Fields (OneEntry `dish` attribute set):
 *   - `weight` (integer) — граммы
 *   - `calorrage` (integer) — ккал
 *   - `rating` (float)
 *   - `cooking_time` (integer min)
 *   - `preferences` (list) — теги
 *   - `ingredients` (string)
 *   - `price` + `currency`
 * @param   {{product: IProductsEntity; dict: IAttributeValues}} props - component props
 * @returns {JSX.Element} Product details panel JSX
 */
const ProductDetails = async ({
  product,
  dict,
}: {
  product: IProductsEntity;
  dict: IAttributeValues;
}): Promise<JSX.Element> => {
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
    (preferences?.value as Array<{ title: string; value: string }>)
      ?.filter((o) => o?.title)
      ?.map((o) => o.title) ?? [];

  const ingredientsText = ingredients?.value as string | undefined;
  const priceVal = price?.value as number | undefined;
  const currencyVal = (currency?.value as string | undefined) ?? 'USD';
  const priceFormatted =
    priceVal != null
      ? currencyVal === 'USD'
        ? `$${priceVal}`
        : `${priceVal} ${currencyVal}`
      : '';

  return (
    <div className="flex flex-col gap-3.75">
      {/* Metrics row + price badge — single line per static-html/details.html:130 */}
      <div className="flex justify-between items-start gap-3.75 lg:flex-row-reverse">
        <div className="flex flex-col gap-3.75 mt-2.5">
          {/* Weight / calorrage / rating */}
          <div className="flex gap-1.25 md:gap-3.75 items-center">
            {weightVal != null ? (
              <>
                <WeightIcon />
                <p className="font-bold text-[12px] tracking-[0.02em] text-white opacity-90">
                  {weightVal} g
                </p>
              </>
            ) : null}
            {calorrageVal != null ? (
              <>
                <FlameIcon />
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
          </div>
        </div>

        {priceFormatted ? (
          <div className="rounded-[10px] w-18 h-13 bg-custom-gradient flex justify-center items-center font-bold text-white text-[20px] shrink-0">
            {priceFormatted}
          </div>
        ) : null}
      </div>

      {/* Cooking time (optional) */}
      {cookingVal != null && cookingVal > 0 ? (
        <div className="flex gap-3.75 items-center">
          <ClockCircleIcon variant="orange" />
          <p className="font-bold text-[12px] tracking-[0.02em] text-white opacity-90">
            {cookingVal} min
          </p>
        </div>
      ) : null}

      {/* Ingredients */}
      {ingredientsText ? (
        <h3 className="font-normal text-[14px] tracking-[0.02em] text-white opacity-90">
          <span className="text-brand">Ingredients:</span> {ingredientsText}
        </h3>
      ) : null}

      {/* Preferences / tags */}
      {prefs.length > 0 ? (
        <div className="flex flex-wrap gap-3.75">
          {prefs.map((p) => (
            <button
              key={p}
              type="button"
              className="font-normal text-[16px] tracking-[0.02em] text-white border border-white rounded-[5px] py-0.75 px-3.75 hover:bg-[rgba(106,108,122,0.5)] hover:border-transparent duration-500 active:bg-brand"
            >
              {p}
            </button>
          ))}
        </div>
      ) : null}

      {/* Add to cart CTA */}
      <AddToCartButton
        id={id}
        units={0}
        statusIdentifier={statusIdentifier || ''}
        productTitle={title || ''}
        dict={dict}
        height={50}
        className="mt-2.5 w-full flex justify-center items-center gap-2.5 font-bold text-[20px] text-white uppercase py-4.5 bg-custom-gradient rounded-[10px] hover:bg-gradient-to-r-hover"
      />
    </div>
  );
};

export default ProductDetails;
