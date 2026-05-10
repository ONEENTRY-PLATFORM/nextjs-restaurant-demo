'use client';

import type { JSX } from 'react';
import { useEffect, useState } from 'react';

import { useAppSelector } from '@/app/store/hooks';
import { selectCartItemWithIdLength } from '@/app/store/reducers/CartSlice';

import DecreaseButton from './DecreaseButton';
import IncreaseButton from './IncreaseButton';
import QuantityInput from './QuantityInput';

/**
 * QuantitySelector — −/qty/+ control for the cart item quantity (renders empty when not in cart).
 *
 * @param   {object}      props             - Component props.
 * @param   {number}      props.id          - Cart product id.
 * @param   {number}      props.units       - Maximum allowed units (cap forwarded to increment handler).
 * @param   {string}      props.title       - Product title used in toast text by the decrement handler.
 * @param   {number}      props.height      - Pixel height applied as inline style.
 * @param   {string}      [props.className] - Additional class merged onto the wrapper.
 * @returns JSX of the quantity selector or empty fragment when the item is not in the cart.
 */
const QuantitySelector = ({
  id,
  units,
  title,
  height,
  className = '',
}: {
  id: number;
  units: number;
  title: string;
  className?: string;
  height: number;
}): JSX.Element => {
  const [qty, setQty] = useState(0);

  const data = useAppSelector(state => selectCartItemWithIdLength(state, id));
  const quantity = data?.quantity || 0;

  useEffect(() => {
    if (!quantity) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQty(quantity);
  }, [quantity]);

  if (qty < 1 || !quantity) {
    return <></>;
  }

  return (
    <div
      className={
        'flex items-center min-h-16.5 justify-between rounded-panel border border-white px-2 text-white/90 ' +
        className
      }
      style={{ height: height }}
    >
      <DecreaseButton id={id} qty={qty} title={title} />
      <QuantityInput id={id} qty={qty} units={units} />
      <IncreaseButton id={id} qty={qty} units={units} />
    </div>
  );
};

export default QuantitySelector;
