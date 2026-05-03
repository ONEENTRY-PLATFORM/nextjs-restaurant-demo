import type { IAttributesSetsEntity } from 'oneentry/dist/attribute-sets/attributeSetsInterfaces';
import type { IAttributeValue } from 'oneentry/dist/base/utils';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { JSX } from 'react';

import { getSingleAttributeByMarkerSet } from '@/app/api';
import { getPageByUrl } from '@/app/api/server/pages/getPageByUrl';
import Loader from '@/components/shared/Loader';
import { sortObjectFieldsByPosition } from '@/components/utils';

import FilterAnimations from './animations/FilterAnimations';
import AvailabilityFilter from './components/AvailabilityFilter';
import ApplyButton from './components/buttons/ApplyButton';
import ResetButton from './components/buttons/ResetButton';
import ColorFilter from './components/color/ColorFilter';
import type { PriceBounds } from './components/price/PricePickerFilter';
import PricePickerFilter from './components/price/PricePickerFilter';

/**
 * Форма фильтров продуктов
 */
const FiltersForm = async ({
  prices,
}: {
  prices: PriceBounds;
}): Promise<JSX.Element> => {
  const pageInfo = await getPageByUrl('filters');
  const data = await getSingleAttributeByMarkerSet({
    setMarker: 'product',
    attributeMarker: 'color',
  });
  const { isError, error, attribute } = data;

  if (isError) {
    return <>{error?.message}</>;
  }

  if (pageInfo.isError || !pageInfo.page) {
    // eslint-disable-next-line no-console
    console.warn(
      '[FiltersForm] Page "filters" unavailable — skipping filters.',
      pageInfo.error,
    );
    return <></>;
  }

  const sortedAttributes: Record<string, IAttributeValue> =
    sortObjectFieldsByPosition(
      (pageInfo.page as IPagesEntity)?.attributeValues,
    );

  if (!sortedAttributes || Object.keys(sortedAttributes).length === 0) {
    return <Loader />;
  }

  return (
    <div
      id="filter"
      className="flex size-full h-auto flex-col overflow-x-hidden overscroll-y-auto px-8 pb-16 pt-5 max-md:max-h-full max-md:px-6"
    >
      {Object.keys(sortedAttributes).map((attr, index) => {
        if (attr === 'price_filter' && prices) {
          return (
            <FilterAnimations key={index} className="w-full" index={0}>
              <PricePickerFilter prices={prices} />
            </FilterAnimations>
          );
        }
        if (attr === 'color_filter') {
          return (
            <FilterAnimations key={index} className="w-full" index={1}>
              <ColorFilter
                key={index}
                title={sortedAttributes[attr]?.value as string}
                attributes={attribute as IAttributesSetsEntity}
              />
            </FilterAnimations>
          );
        }
        if (attr === 'availability_filter') {
          return (
            <FilterAnimations key={index} className="w-full" index={2}>
              <AvailabilityFilter
                key={index}
                title={sortedAttributes[attr]?.value as string}
              />
            </FilterAnimations>
          );
        }
        return;
      })}
      <div className="relative mt-auto box-border flex shrink-0 flex-col gap-4">
        <FilterAnimations className="w-full" index={3}>
          <ResetButton />
        </FilterAnimations>
        <FilterAnimations className="w-full" index={4}>
          <ApplyButton />
        </FilterAnimations>
      </div>
    </div>
  );
};

export default FiltersForm;
