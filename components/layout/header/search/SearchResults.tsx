/* eslint-disable @typescript-eslint/no-explicit-any */
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

/**
 * Search results
 */
const SearchResults = ({
  searchValue,
  state,
  setState,
}: {
  searchValue: string;
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
        products.map(async (product: any) => {
          if (product.productPages.length > 0) {
            const pageData = await getPageById(product.productPages[0].pageId);
            pagesData[product.id] = pageData;
          }
        }),
      );
      setPages(pagesData);
    };

    if (products.length > 0) {
      fetchPages();
    }
  }, [products]);

  if (loading) {
    return <Spinner />;
  }

  if (!state) {
    return <></>;
  }

  return (
    <div className="absolute left-0 top-full z-30 mt-px flex w-full flex-col gap-1 rounded-2xl bg-white p-5 shadow-lg">
      <CloseSearch setState={setState} />
      {products.length > 0 ? (
        products.map((product: IProductsEntity, i: number) => {
          const { id, attributeSetIdentifier } = product;

          // Skip rendering for 'service_product' type
          if (attributeSetIdentifier === 'service_product') {
            return null;
          }

          return (
            <div key={id + i} className="flex w-full">
              <ProductRow
                pageData={pages[id]?.page}
                product={product}
                setState={setState}
              />
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
