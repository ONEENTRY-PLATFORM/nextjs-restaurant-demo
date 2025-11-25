import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';
import { useLayoutEffect, useState } from 'react';

import { useAppSelector } from '@/app/store/hooks';
import { selectCartTotal } from '@/app/store/reducers/CartSlice';
import { UsePrice } from '@/components/utils';

import TableRowAnimations from '../animations/TableRowAnimations';

/**
 * Total amount price of all products in cart
 */
const TotalAmount = ({
  dict,
  className,
}: {
  dict: IAttributeValues;
  className: string;
}): JSX.Element => {
  const [cartTotal, setCartTotal] = useState(0);
  const total = useAppSelector(selectCartTotal);
  const deliveryPrice = useAppSelector((state) => {
    return state.cartReducer.delivery?.price || 0;
  });

  // set total on data change
  useLayoutEffect(() => {
    if (!total) {
      setCartTotal(0);
    } else {
      setCartTotal(total + deliveryPrice);
    }
  }, [total, deliveryPrice]);

  return (
    <TableRowAnimations className={className} index={12}>
      {dict?.order_info_total?.value}:{' '}
      {UsePrice({
        amount: cartTotal,
      })}
    </TableRowAnimations>
  );
};

export default TotalAmount;
