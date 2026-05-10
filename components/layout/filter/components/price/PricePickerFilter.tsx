/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { getTrackBackground, Range } from 'react-range';

import { useT } from '@/app/store/providers/DictProvider';

import PriceFromInput from './PriceFromInput';
import PriceToInput from './PriceToInput';

export type PriceBounds = { min?: number; max?: number } | undefined;

/**
 * PriceFilter — price-range filter with two inputs and a draggable Range; syncs to `minPrice`/`maxPrice` URL params.
 *
 * @param   {object}        props        - Component props.
 * @param   {PriceBounds}   props.prices - Catalog price bounds; defaults are 0 and 100 when missing.
 * @returns {JSX.Element} JSX of the price filter section.
 */
const PriceFilter = ({ prices }: { prices: PriceBounds }): JSX.Element => {
  const t = useT();
  const pathname = usePathname();
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams);

  const STEP = 10;
  const MIN = prices?.min || 0;
  const MAX = prices?.max || 100;

  const [priceFrom, setPriceFrom] = useState(
    params.get('minPrice') ? Number(params.get('minPrice')) : MIN
  );
  const [priceTo, setPriceTo] = useState(
    params.get('maxPrice') ? Number(params.get('maxPrice')) : MAX
  );

  useEffect(() => {
    if (priceFrom && priceFrom !== MIN) {
      params.set('minPrice', priceFrom.toString());
    } else {
      params.delete('minPrice');
    }
    replace(`${pathname}?${params.toString()}`);
  }, [priceFrom]);

  useEffect(() => {
    if (priceTo && priceTo !== MAX) {
      params.set('maxPrice', priceTo.toString());
    } else {
      params.delete('maxPrice');
    }
    replace(`${pathname}?${params.toString()}`);
  }, [priceTo]);

  useEffect(() => {
    if (!params.get('minPrice')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPriceFrom(MIN);
    }
  }, [params.get('minPrice')]);

  useEffect(() => {
    if (!params.get('maxPrice')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPriceTo(MAX);
    }
  }, [params.get('maxPrice')]);

  return (
    <div className="relative box-border flex shrink-0 flex-col">
      <div className="filter_title mb-5 self-start">{t('filter_price_title', 'Price')}</div>

      <div className="mb-6 flex w-full gap-5 self-center">
        <div className="flex flex-1 gap-2.5 rounded-card border border-paper/40 bg-transparent px-3 py-1.5">
          <span className="text-base leading-8 text-paper/60">{t('from', 'From')}</span>
          <span className="text-lg leading-8 text-white/90">
            <PriceFromInput price={priceFrom} setPrice={setPriceFrom} />
          </span>
        </div>
        <div className="flex flex-1 gap-2.5 rounded-card border border-paper/40 bg-transparent px-3 py-1.5">
          <span className="self-start text-base leading-8 text-paper/60">{t('to_text', 'To')}</span>
          <span className="text-lg leading-8 text-white/90">
            <PriceToInput price={priceTo} setPrice={setPriceTo} />
          </span>
        </div>
      </div>

      <div className="flex w-full justify-between gap-5 self-center text-base leading-8 text-paper/60">
        <span>{MIN}</span>
        <span>{(MAX - MIN) / 2}</span>
        <span>{MAX}</span>
      </div>
      <div className="mb-5 flex w-full px-2">
        <Range
          label="Select your price"
          step={STEP}
          min={MIN}
          max={MAX}
          values={[priceFrom, priceTo]}
          onChange={values => {
            if (values[0] !== undefined) setPriceFrom(values[0]);
            if (values[1] !== undefined) setPriceTo(values[1]);
          }}
          renderMark={({ props, index }) => (
            <div
              {...props}
              key={props.key}
              style={{
                ...props.style,
                height: '16px',
                width: '1px',
                backgroundColor:
                  index * STEP < priceFrom ? '#ccc' : index * STEP > priceTo ? '#ccc' : '#ffa03d',
              }}
            />
          )}
          renderTrack={({ props, children }) => (
            <div
              onMouseDown={props.onMouseDown}
              onTouchStart={props.onTouchStart}
              style={{
                ...props.style,
                height: '36px',
                display: 'flex',
                width: '100%',
              }}
            >
              <div
                ref={props.ref}
                style={{
                  height: '5px',
                  width: '100%',
                  borderRadius: '4px',
                  background: getTrackBackground({
                    values: [priceFrom, priceTo],
                    colors: ['#ccc', '#ffa03d', '#ccc'],
                    min: MIN,
                    max: MAX,
                  }),
                  alignSelf: 'center',
                }}
              >
                {children}
              </div>
            </div>
          )}
          renderThumb={({ props }) => (
            <div
              {...props}
              key={props.key}
              style={{
                ...props.style,
                height: '20px',
                width: '20px',
                borderRadius: '50%',
                backgroundColor: '#f97316',
                outline: '3px solid #ec722b80',
              }}
            />
          )}
        />
      </div>
    </div>
  );
};

export default PriceFilter;
