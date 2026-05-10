import Image from 'next/image';
import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import ClockCircleIcon from '@/components/icons/clock-circle';
import StarPuffyIcon from '@/components/icons/star-puffy';

import AddToCartButton from '../components/AddToCartButton';

/**
 * ProductDetails - right column of the product page (metrics, tags, CTA).
 *
 * Reads from the OneEntry `dish` set: `weight`, `calorrage`, `rating`, `cooking_time`,
 * `preferences`, `ingredients`, `price` + `currency`.
 * @param   {object}          props         - Component props.
 * @param   {IProductsEntity} props.product - OneEntry product entity.
 * @returns {Promise<JSX.Element>}          Details panel JSX.
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
      {/* Metrics row + price badge - single line per static-html/details.html:130 */}
      <div className="flex justify-between items-start gap-3.75 lg:flex-row-reverse">
        <div className="flex flex-col gap-3.75 mt-2.5">
          {/* Weight / calories / rating + cooking_time (on mobile) */}
          <div className="flex gap-1.25 md:gap-3.75 items-center">
            {weightVal != null ? (
              <>
                <Image src="/images/icons/weight.svg" alt="weight" width={27} height={20} />
                <p className="font-bold text-[12px] tracking-fine text-white opacity-90">
                  {weightVal} g
                </p>
              </>
            ) : null}
            {calorrageVal != null ? (
              <>
                <Image src="/images/icons/flame.svg" alt="flame" width={15} height={20} />
                <p className="font-bold text-[12px] tracking-fine text-white opacity-90">
                  {calorrageVal} ccal
                </p>
              </>
            ) : null}
            {ratingVal != null ? (
              <>
                <StarPuffyIcon />
                <p className="font-bold text-[12px] tracking-fine text-white opacity-90">
                  {ratingVal}
                </p>
              </>
            ) : null}
            {/* Cooking time - mobile/tablet variant, in the same row as the metrics */}
            {cookingVal != null && cookingVal > 0 ? (
              <div className="flex gap-1.25 items-center lg:hidden">
                <ClockCircleIcon variant="orange" />
                <p className="font-bold text-[12px] tracking-fine text-white opacity-90">
                  {cookingVal} min
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {priceFormatted ? (
          <div className="rounded-panel w-18 h-13 bg-custom-gradient hidden md:flex justify-center items-center font-bold text-white text-xl shrink-0 md:mt-0">
            {priceFormatted}
          </div>
        ) : null}
      </div>

      {/* Cooking time - desktop variant, on a separate line below (lg+) */}
      {cookingVal != null && cookingVal > 0 ? (
        <div className="hidden lg:flex gap-3.75 items-center mt-7.5">
          <ClockCircleIcon variant="orange" />
          <p className="font-bold text-[12px] tracking-fine text-white opacity-90">
            {cookingVal} min
          </p>
        </div>
      ) : null}

      {/* Ingredients */}
      {ingredientsText ? (
        <h3 className="font-normal text-[14px] tracking-fine text-white opacity-90">
          <span className="text-brand">Ingredients:</span> {ingredientsText}
        </h3>
      ) : null}

      {/* Preferences / tags - pills, link to /shop?preferences=<value> (same contract as CategoriesScroller) */}
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
      <div className="mt-2.5 min-h-16.5">
        <AddToCartButton
          id={id}
          units={0}
          statusIdentifier={statusIdentifier || ''}
          productTitle={title || ''}
          height={50}
          className="min-h-16.5 w-full flex justify-center items-center gap-2.5 font-bold text-xl text-white uppercase py-4.5 bg-custom-gradient rounded-panel hover:bg-gradient-to-r-hover"
        />
      </div>
    </div>
  );
};

export default ProductDetails;
