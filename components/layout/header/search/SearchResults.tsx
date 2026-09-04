'use client';

import type { IPagesEntity, IProductsEntity } from 'oneentry/types';
import type { Dispatch, JSX } from 'react';
import { useEffect, useState } from 'react';

import { RTKApi } from '@/app/api/api/RTKApi';
import { useSearchProducts } from '@/app/api/hooks/useSearchProducts';
import { useAppDispatch } from '@/app/store/hooks';
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
  const dispatch = useAppDispatch();
  const [pages, setPages] = useState<{
    [key: number]: {
      page?: IPagesEntity;
    };
  }>({});
  const { loading, products } = useSearchProducts({
    name: searchValue,
  });

  useEffect(() => {
    /*
      Pages come from the RTK endpoint, not from `getPageById` in
      `app/api/server/pages/`. That wrapper is `unstable_cache`-backed — a
      server-only API — and importing it here bundled the cache wiring into the
      client chunk, where its cache means nothing: `unstable_cache` keys live on
      the server, so every visitor re-fetched anyway while paying for the code.

      `initiate` rather than the `useGetPageByIdQuery` hook because the id list
      is dynamic and hooks cannot be called per item; going through the store
      still shares the endpoint's cache (600 s) across the whole session.
    */
    const fetchPages = async () => {
      const pagesData: {
        [key: number]: {
          page?: IPagesEntity;
        };
      } = {};
      await Promise.all(
        products.map(async (product: IProductsEntity) => {
          const firstPage = product.productPages?.[0];
          if (!firstPage) {
            return;
          }
          try {
            const page = await dispatch(
              RTKApi.endpoints.getPageById.initiate({ id: firstPage.pageId })
            ).unwrap();
            pagesData[product.id] = { page };
          } catch {
            // A page that fails to load just renders the row without its link — as before.
          }
        })
      );
      setPages(pagesData);
    };

    if (products.length > 0) {
      fetchPages();
    }
  }, [products, dispatch]);

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
