import Link from 'next/link';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import AddToCartButton from '../components/AddToCartButton';

type ProductPageLink = { categoryPath?: string };

type DishProduct = IProductsEntity & {
  productPages?: ProductPageLink[];
};

/**
 * Product details column — верстка `details_personal.html`.
 *
 * Fields (OneEntry `dish` attribute set):
 *   - `localizeInfos.title` — заголовок
 *   - `productPages[0].categoryPath` → `menu/<slug>` — категория
 *   - `weight` (integer) — граммы
 *   - `calorrage` (integer) — ккал
 *   - `rating` (float)
 *   - `cooking_time` (integer min)
 *   - `preferences` (list) — теги
 *   - `ingredients` (string)
 *   - `price` + `currency`
 * @param   {{product: DishProduct; dict: IAttributeValues}} props - component props
 * @returns {JSX.Element} Product details column JSX
 */
const ProductDetails = async ({
  product,
  dict,
}: {
  product: DishProduct;
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
    productPages,
  } = product;

  // Parse "menu/desserts" → "desserts"
  const categoryPath = productPages?.[0]?.categoryPath ?? '';
  const categorySlug = categoryPath.split('/').pop() ?? '';
  const categoryLabel = categorySlug
    ? categorySlug
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : '';

  const weightVal = weight?.value as number | undefined;
  const calorrageVal = calorrage?.value as number | undefined;
  const ratingVal = rating?.value as number | undefined;
  const cookingVal = cooking_time?.value as number | undefined;

  const prefs = (preferences?.value as Array<{ title: string; value: string }>)
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
    <div className="flex flex-col gap-[15px]">
      {/* Category + title */}
      {categoryLabel ? (
        <Link
          href={'/shop/category/' + categorySlug}
          className="font-normal text-[16px] text-[#969696]"
        >
          Category / {categoryLabel}
        </Link>
      ) : null}
      <h1 className="font-bold text-[20px] tracking-[0.02em] text-white">
        {title}
      </h1>

      {/* Weight / calorrage / rating row */}
      <div className="flex gap-[5px] md:gap-[15px] items-center">
        {weightVal != null ? (
          <>
            <svg
              width="27"
              height="20"
              viewBox="0 0 27 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M24.4533 14.3512C24.4533 8.4106 19.8271 3.52554 13.9733 3.08005V0H12.2267V3.08005C6.37288 3.52571 1.74667 8.4106 1.74667 14.3512V16.1505H24.4533V14.3512ZM0 18.2609H26.2V20H0V18.2609Z"
                fill="#EC722B"
              />
            </svg>
            <p className="font-bold text-[12px] tracking-[0.02em] text-white opacity-90">
              {weightVal} g
            </p>
          </>
        ) : null}
        {calorrageVal != null ? (
          <>
            <svg
              width="15"
              height="20"
              viewBox="0 0 15 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M1.66407 7.62437L1.66143 7.62831L1.65482 7.63619L1.63498 7.66244L1.5662 7.75562C1.50933 7.83437 1.43262 7.94856 1.34268 8.09163C1.10414 8.47855 0.899703 8.88518 0.731644 9.307C0.32164 10.3308 -0.00900944 11.7811 0.359995 13.4243C0.70916 14.9862 1.38368 16.4352 2.55286 17.4983C3.73262 18.5693 5.3528 19.1875 7.47424 19.1875C9.61288 19.1875 11.2886 18.4748 12.4247 17.2542C13.5516 16.0414 14.0872 14.3929 14.0872 12.625C14.0872 11.4976 13.709 10.4082 13.2011 9.391C12.7183 8.42237 12.0914 7.4695 11.5029 6.57306L11.4156 6.44181C10.79 5.49025 10.2213 4.61088 9.84169 3.7735C9.46475 2.93744 9.31662 2.22475 9.44359 1.59738C9.46275 1.5022 9.46041 1.404 9.43673 1.30983C9.41305 1.21567 9.36861 1.12789 9.30663 1.05282C9.24464 0.977747 9.16665 0.917255 9.07827 0.875699C8.98988 0.834143 8.89331 0.812559 8.79551 0.8125C8.23738 0.8125 7.30627 1.00675 6.4241 1.45956C5.53399 1.91763 4.60421 2.68412 4.19949 3.88637C3.68368 5.422 4.27885 7.1545 4.7854 8.24781C5.01157 8.73344 4.81582 9.27156 4.44153 9.45794C4.3574 9.49988 4.26577 9.52493 4.17187 9.53166C4.07797 9.53839 3.98366 9.52666 3.89434 9.49716C3.80501 9.46765 3.72243 9.42094 3.65134 9.35971C3.58024 9.29847 3.52201 9.22392 3.48 9.14031L2.77373 7.73725C2.72399 7.63854 2.64996 7.55387 2.5585 7.49108C2.46704 7.42829 2.3611 7.3894 2.25047 7.37802C2.13985 7.36663 2.02812 7.38312 1.92563 7.42595C1.82313 7.46879 1.73317 7.53789 1.66407 7.62437Z"
                fill="#EC722B"
              />
            </svg>
            <p className="font-bold text-[12px] tracking-[0.02em] text-white opacity-90">
              {calorrageVal} ccal
            </p>
          </>
        ) : null}
        {ratingVal != null ? (
          <>
            <svg
              className="w-[20px] h-[20px]"
              viewBox="0 0 17 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M15.9,7.8c0.3-0.3,0.4-0.8,0.3-1.2c-0.1-0.4-0.5-0.7-0.8-0.8l-3.6-0.9c-0.1,0-0.1-0.1-0.2-0.1l-2-3.2C9,1,8.1,0.9,7.6,1.6l-2,3.2l0,0.1L1.8,5.8l-0.1,0C1.3,6,1.1,6.3,1,6.7c-0.1,0.3,0,0.7,0.2,1l2.4,2.9l0.1,0.1c0,0,0,0.1,0,0.1l-0.3,3.8c0,0.4,0.2,0.8,0.6,1c0.3,0.2,0.7,0.2,1,0.1l3.5-1.4l3.6,1.4c0.2,0.1,0.3,0.1,0.5,0.1c0.3,0,0.5-0.1,0.7-0.3c0.3-0.2,0.4-0.6,0.3-0.9l-0.3-3.8c0-0.1,0-0.1,0.1-0.2L15.9,7.8z"
                fill="#ED742C"
                stroke="#ED742C"
                strokeWidth="2"
              />
            </svg>
            <p className="font-bold text-[12px] tracking-[0.02em] text-white opacity-90">
              {ratingVal}
            </p>
          </>
        ) : null}
      </div>

      {/* Cooking time (optional) */}
      {cookingVal != null && cookingVal > 0 ? (
        <div className="flex gap-[15px] items-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 0.5C15.2469 0.5 19.5 4.75314 19.5 10C19.5 15.2469 15.2469 19.5 10 19.5C4.75314 19.5 0.5 15.2469 0.5 10C0.5 4.75314 4.75314 0.5 10 0.5ZM10 1.5C7.74566 1.5 5.58365 2.39553 3.98959 3.98959C2.39553 5.58365 1.5 7.74566 1.5 10C1.5 12.2543 2.39553 14.4163 3.98959 16.0104C5.58365 17.6045 7.74566 18.5 10 18.5C12.2543 18.5 14.4163 17.6045 16.0104 16.0104C17.6045 14.4163 18.5 12.2543 18.5 10C18.5 7.74566 17.6045 5.58365 16.0104 3.98959C14.4163 2.39553 12.2543 1.5 10 1.5Z"
              stroke="#EC722B"
            />
          </svg>
          <p className="font-bold text-[12px] tracking-[0.02em] text-white opacity-90">
            {cookingVal} min
          </p>
        </div>
      ) : null}

      {/* Price badge */}
      {priceFormatted ? (
        <div className="rounded-[10px] w-[72px] h-[52px] bg-custom-gradient flex justify-center items-center font-bold text-white text-[20px]">
          {priceFormatted}
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
        <div className="flex flex-wrap gap-[15px]">
          {prefs.map((p) => (
            <button
              key={p}
              type="button"
              className="font-normal text-[16px] tracking-[0.02em] text-white border border-white rounded-[5px] py-[3px] px-[15px] hover:bg-[rgba(106,108,122,0.5)] hover:border-transparent duration-500 active:bg-brand"
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
        className="mt-[10px] w-full flex justify-center items-center gap-[10px] font-bold text-[20px] text-white uppercase py-[18px] bg-custom-gradient rounded-[10px] hover:bg-gradient-to-r-hover"
      />
    </div>
  );
};

export default ProductDetails;
