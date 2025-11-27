import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import WithSidebar from '@/app/[handle]/WithSidebar';
import { getProductById } from '@/app/api';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import CartPage from '@/components/layout/cart';

import { getDictionary } from '../dictionaries';

/**
 * Cart page
 */
const CartPageLayout = async ():  Promise<JSX.Element> => {
  // Get dictionary and set to server provider
  const [dict] = ServerProvider('dict', await getDictionary());
  // Get delivery(product) data by product id
  const { product } = await getProductById(83);

  return (
    <section className="relative mx-auto box-border flex min-h-80 w-full max-w-(--breakpoint-xl) shrink-0 grow flex-col self-stretch">
      <div className="flex w-full flex-col items-center gap-5">
        <WithSidebar>
          <CartPage dict={dict} deliveryData={product as IProductsEntity} />
        </WithSidebar>
      </div>
    </section>
  );
};

export default CartPageLayout;
