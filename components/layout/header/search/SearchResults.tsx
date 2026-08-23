'use client';

import type { IPagesEntity, IProductsEntity } from 'oneentry/types';
import type { Dispatch, JSX } from 'react';
import { useEffect, useState } from 'react';

import { getPageById } from '@/app/api';
import { useSearchProducts } from '@/app/api/hooks/useSearchProducts';
import { useT } from '@/app/store/providers/DictProvider';
import SearchIcon from '@/components/icons/search';
import Spinner from '@/components/shared/Spinner';

import CloseSearch from './CloseSearch';
import ProductRow from './ProductRow';

/**
 * SearchResults — dropdown panel rendered under the search bar with product results from the SDK.
 *
 * @param   {object}                                          props              - Component props.
 * @param   {string}                                          props.searchValue  - Debounced search query.
 * @param   {boolean}                                         [props.isPending]  - When `true`, the input value differs from the debounced one — show a spinner.
 * @param   {boolean}                                         props.state        - Whether the panel is currently visible.
 * @param   {Dispatch<React.SetStateAction<boolean>>}         props.setState     - Setter that toggles the panel visibility.
 * @param   {(() => void) | null}                             props.onOpenInShop - Navigates to `/shop?search=<query>`; `null` on shop pages where the grid filters live and no jump is needed.
 * @returns JSX of the search results panel, or empty fragment when not shown.
 */
const SearchResults = ({
  searchValue,
  isPending = false,
  state,
  setState,
  onOpenInShop,
}: {
  searchValue: string;
  isPending?: boolean;
  state: boolean;
  setState: Dispatch<React.SetStateAction<boolean>>;
  onOpenInShop: (() => void) | null;
}): JSX.Element => {
  const t = useT();
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
  const visibleProducts = products.filter(
    (product: IProductsEntity) => product.attributeSetIdentifier !== 'service_product'
  );
  const hasResults = !isBusy && visibleProducts.length > 0;

  return (
    <div className="absolute top-full left-0 z-30 mt-px flex w-full flex-col gap-1 rounded-panel bg-ink/80 p-5 shadow-lg backdrop-blur-card">
      {hasResults && onOpenInShop ? (
        <button
          type="button"
          onClick={onOpenInShop}
          aria-label="Open all results in shop"
          className="absolute top-2.5 right-9 size-6 cursor-pointer transition-opacity hover:opacity-80"
        >
          <SearchIcon />
        </button>
      ) : null}
      <CloseSearch setState={setState} />
      {isBusy ? (
        <Spinner />
      ) : visibleProducts.length > 0 ? (
        visibleProducts.map((product: IProductsEntity) => {
          const { id } = product;
          return (
            <div key={id} className="flex w-full">
              <ProductRow pageData={pages[id]?.page} product={product} setState={setState} />
            </div>
          );
        })
      ) : (
        <p>{t('no_products_found_text', 'No products found')}</p>
      )}
    </div>
  );
};

export default SearchResults;
