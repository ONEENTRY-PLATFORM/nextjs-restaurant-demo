/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useState } from 'react';

import { api, useGetProductsByIdsQuery } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import {
  addDeliveryToCart,
  addProductsToCart,
  selectCartData,
  selectDeliveryData,
} from '@/app/store/reducers/CartSlice';
import { addData, setStep } from '@/app/store/reducers/OrderSlice';
import CartAnimations from '@/components/layout/cart/animations/CartAnimations';
import TableRowAnimations from '@/components/layout/cart/animations/TableRowAnimations';
import EmptyCart from '@/components/layout/cart/components/EmptyCart';
import ProductCard from '@/components/layout/cart/components/ProductCard';
import Loader from '@/components/shared/Spinner';

/**
 * Cart page
 */
const CartPage = ({
  deliveryData,
}: {
  deliveryData: IProductsEntity;
}): JSX.Element => {
  const dispatch = useAppDispatch();
  const { isAuth, user } = useContext(AuthContext);
  const [products, setProducts] = useState<IProductsEntity[]>([]);
  const cartDelivery = useAppSelector(selectDeliveryData);

  // Mirror the cart's delivery state into OrderSlice.formData so the
  // submit on `payment` step still has `delivery_time` / `delivery_address`
  // even though the legacy DeliveryForm isn't rendered (per cart_cart.html /
  // pk_cart.html — the cart screen is products + APPLY only).
  useEffect(() => {
    const date = cartDelivery.date;
    const time = cartDelivery.time;
    const addressReg =
      user?.formData.find((el) => el.marker === 'address_reg')?.value ?? '';
    const address = (cartDelivery.address as string | undefined) || addressReg;

    if (date) {
      dispatch(
        addData({
          marker: 'delivery_time',
          type: 'timeInterval',
          value: {
            fullDate: new Date(date).toISOString(),
            formattedValue: `${new Date(date).toDateString()} ${time ?? ''}`,
            formatString: 'YYYY-MM-DD HH:mm',
          },
          valid: true,
        }),
      );
    }
    if (address) {
      dispatch(
        addData({
          marker: 'delivery_address',
          type: 'string',
          value: address,
          valid: true,
        }),
      );
    }
  }, [cartDelivery, user, dispatch]);

  // products in redux carSlice
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productsCartData = useAppSelector(selectCartData) as any[];

  // Get Products By Ids from api
  const { data, isLoading } = useGetProductsByIdsQuery({
    items: productsCartData.map((p) => p.id),
  });

  // add delivery Data
  useEffect(() => {
    if (deliveryData) {
      dispatch(addDeliveryToCart(deliveryData));
    }
  }, [deliveryData]);

  // add products to cart slice
  useEffect(() => {
    // Check if there is data available to set products
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts(data); // Initialize products state with fetched data

      // If the user is authenticated, establish a WebSocket connection
      if (isAuth) {
        const ws = api.WS.connect(); // Connect to WebSocket
        if (ws) {
          // Listen for 'notification' events from the WebSocket
          ws.on('notification', async (res) => {
            if (res?.product) {
              // Prepare product object with additional attribute values
              const product = {
                ...res.product,
                attributeValues: res.product?.attributes,
              };

              // Find the index of the product in the current data array
              const index = data.findIndex(
                (p: IProductsEntity) => p.id === product.id,
              );

              // Parse the new price from the notification response
              const newPrice = parseInt(
                product?.attributeValues?.price?.value,
                10,
              );

              // Update the products state with the new price and status
              setProducts((prevProducts) => {
                // Create a copy of the current products
                const newProducts = [...prevProducts];
                if (newProducts[index]) {
                  newProducts[index] = {
                    ...newProducts[index], // Preserve existing product properties
                    price: newPrice, // Update the price with the new value
                    statusIdentifier: res?.product?.status?.identifier, // Update the status identifier
                  };
                }
                return newProducts; // Return the updated products array
              });
            }
          });

          // Cleanup function to disconnect the WebSocket when the component unmounts or dependencies change
          return () => {
            ws.disconnect();
          };
        }
      }
    }
    return undefined;
    // Dependency array: effect will run when 'data' changes
  }, [data]);

  // update products in cart
  useEffect(() => {
    if (products) {
      dispatch(addProductsToCart(products));
    }
  }, [products]);

  if (isLoading) {
    return <Loader />;
  }

  if (!products || products.length < 1) {
    return <EmptyCart />;
  }

  const onApply = () => {
    const hasTime = Boolean(cartDelivery?.date && cartDelivery?.time);
    dispatch(setStep(hasTime ? 'signin' : 'time'));
  };

  return (
    <div className="flex w-full flex-col overflow-hidden pb-5 lg:max-w-182.5">
      <CartAnimations className={'mb-4 flex w-full flex-col gap-4'} index={1}>
        {products?.map((product: IProductsEntity, i: number) => {
          // Look up selection by id, not index — `productsCartData` may be
          // in a different order than `products` (RTK query response order
          // is not guaranteed) and changing one entry's `selected` mutates
          // the array reference, so an index-based lookup desynchronises.
          const cartEntry = productsCartData.find(
            (p: { id: number }) => p.id === product.id,
          );
          return (
            <ProductCard
              key={product.id}
              index={i}
              product={product}
              selected={cartEntry?.selected ?? false}
            />
          );
        })}
      </CartAnimations>
      <TableRowAnimations className={'mt-7.5 flex w-full'} index={5}>
        <button
          type="button"
          onClick={onApply}
          className="flex h-15 w-full items-center justify-center rounded-[10px] bg-custom_btnorange text-center font-normal text-[16px] text-white hover_btn_transp md:h-11.25"
        >
          APPLY
        </button>
      </TableRowAnimations>
    </div>
  );
};

export default CartPage;
