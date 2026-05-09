'use client';

import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { Dispatch, JSX } from 'react';
import { useEffect, useState } from 'react';

import { getPageById } from '@/app/api';
import { useSearchProducts } from '@/app/api/hooks/useSearchProducts';
import Spinner from '@/components/shared/Spinner';

import CloseSearch from './CloseSearch';
import ProductRow from './ProductRow';

/** Search results. */
const SearchResults = ({
  searchValue,
  isPending = false,
  state,
  setState,
}: {
  searchValue: string;
  isPending?: boolean;
  state: boolean;
  setState: Dispatch<React.SetStateAction<boolean>>;
}): JSX.Element => {
  const [pages, setPages] = useState<{
    [key: number]: {
      page?: IPagesEntity;
    };
  }>({});
  const { loading, products } = useSearchProducts({
    name: searchValue,
  });

  useEffect(() => {
    const fetchPages = async () => {
      const pagesData: {
        [key: number]: {
          page?: IPagesEntity;
        };
      } = {};
      await Promise.all(
        products.map(async (product: IProductsEntity) => {
          const firstPage = product.productPages?.[0];
          if (firstPage) {
            const pageData = await getPageById(firstPage.pageId);
            pagesData[product.id] = pageData;
          }
        })
      );
      setPages(pagesData);
    };

    if (products.length > 0) {
      fetchPages();
    }
  }, [products]);

  if (!state) {
    return <></>;
  }

  const isBusy = loading || isPending;

  return (
    <div className="absolute left-0 top-full z-30 mt-px flex w-full flex-col gap-1 rounded-[10px] bg-ink/80 p-5 shadow-lg backdrop-blur-[10px]">
      <CloseSearch setState={setState} />
      {isBusy ? (
        <Spinner />
      ) : products.length > 0 ? (
        products
          .filter(
            (product: IProductsEntity) => product.attributeSetIdentifier !== 'service_product'
          )
          .map((product: IProductsEntity) => {
            const { id } = product;
            return (
              <div key={id} className="flex w-full">
                <ProductRow pageData={pages[id]?.page} product={product} setState={setState} />
              </div>
            );
          })
      ) : (
        <p>No products found</p>
      )}
    </div>
  );
};

export default SearchResults;
