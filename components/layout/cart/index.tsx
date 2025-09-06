/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { FC } from 'react';
import { useContext, useEffect, useState } from 'react';

import { api, useGetProductsByIdsQuery } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import {
  addDeliveryToCart,
  addProductsToCart,
  selectCartData,
} from '@/app/store/reducers/CartSlice';
import CartAnimations from '@/components/layout/cart/animations/CartAnimations';
import EmptyCart from '@/components/layout/cart/components/EmptyCart';
import ProductCard from '@/components/layout/cart/components/ProductCard';
import Loader from '@/components/shared/Spinner';

import DeliveryForm from './delivery-table/DeliveryForm';

interface CartPageProps {
  dict: IAttributeValues;
  deliveryData: IProductsEntity;
}

/**
 * Cart page
 * @param dict dictionary from server api
 * @param deliveryData Represents a product entity object.
 *
 * @returns
 */
const CartPage: FC<CartPageProps> = ({ dict, deliveryData }) => {
  const dispatch = useAppDispatch();
  const { isAuth } = useContext(AuthContext);
  const [products, setProducts] = useState<IProductsEntity[]>([]);

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
                newProducts[index] = {
                  ...products[index], // Preserve existing product properties
                  price: newPrice, // Update the price with the new value
                  statusIdentifier: res?.product?.status?.identifier, // Update the status identifier
                };
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
    return <EmptyCart dict={undefined} />;
  }

  return (
    <div className="flex w-full flex-col overflow-hidden pb-5 lg:max-w-[730px]">
      <CartAnimations className={'mb-4 flex w-full flex-col gap-4'} index={1}>
        {products?.map((product: IProductsEntity, i: number) => {
          return (
            <ProductCard
              key={i}
              index={i}
              product={product}
              selected={productsCartData[i]?.selected}
              dict={dict}
            />
          );
        })}
      </CartAnimations>
      <DeliveryForm dict={dict} deliveryData={deliveryData} />
    </div>
  );
};

export default CartPage;
