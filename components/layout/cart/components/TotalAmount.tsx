'use client';

import type { IProductsEntity } from 'oneentry/types';
import type { JSX } from 'react';
import { useMemo } from 'react';

import { getProductCurrency } from '@/app/api/hooks/useAttributesData';
import { useAppSelector } from '@/app/store/hooks';
import { useT } from '@/app/store/providers/DictProvider';
import { selectCartData } from '@/app/store/reducers/CartSlice';
import { DELIVERY_PRODUCT_ID } from '@/app/utils/constants';
import { UsePrice } from '@/components/utils';

import TableRowAnimations from '../animations/TableRowAnimations';

type CartEntry = {
  id: number;
  selected?: boolean;
  quantity?: number;
};

/**
 * TotalAmount — total amount for selected cart entries + delivery.
 *
 * @param   {object}      props           - Component props.
 * @param   {string}      props.className - Class merged onto the row wrapper.
 * @returns JSX of the total-amount line.
 */
const TotalAmount = ({ className }: { className: string }): JSX.Element => {
  const t = useT();
  const productsData = useAppSelector(selectCartData) as CartEntry[];
  const products = useAppSelector(state => state.cartReducer.products as IProductsEntity[]);
  const deliveryPrice = useAppSelector(
    state => Number(state.cartReducer.delivery?.price ?? 0) || 0
  );

  const cartTotal = useMemo(() => {
    const productsById = new Map<number, IProductsEntity>(products.map(p => [p.id, p]));

    const subtotal = productsData
      .filter(entry => entry.selected !== false && entry.id !== DELIVERY_PRODUCT_ID)
      .reduce((sum, entry) => {
        const product = productsById.get(entry.id);
        if (!product) return sum;
        const sale = Number(product.attributeValues?.sale?.value as number | undefined);
        const list = Number(
          (product.attributeValues?.price?.value as number | undefined) ?? product.price
        );
        const unit = sale && sale > 0 ? sale : list || 0;
        const qty = Number(entry.quantity ?? 1);
        return sum + unit * qty;
      }, 0);

    return subtotal + deliveryPrice;
  }, [productsData, products, deliveryPrice]);

  // All cart products share one currency (single-currency project); take the first non-empty.
  const currency = useMemo(
    () => products.map(p => getProductCurrency(p.attributeValues)).find(Boolean),
    [products]
  );

  return (
    <TableRowAnimations className={className} index={12}>
      {t('total_amount_text', 'Total')}: {UsePrice({ amount: cartTotal, currency })}
    </TableRowAnimations>
  );
};

export default TotalAmount;
