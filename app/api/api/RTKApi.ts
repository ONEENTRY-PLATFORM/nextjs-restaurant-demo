import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  IAccountsEntity,
  IAuthProvidersEntity,
  IBaseOrdersEntity,
  IBlockEntity,
  IBonusBalanceEntity,
  IBonusTransactionEntity,
  IError,
  IFormsEntity,
  IMenusEntity,
  IOrderByMarkerEntity,
  IOrderData,
  IOrdersEntity,
  IPagesEntity,
  IPositionBlock,
  IProductsEntity,
  IProductsResponse,
  ISessionEntity,
  IUserEntity,
} from 'oneentry/types';

import { isError } from '@/app/api';
import type { IProducts } from '@/app/types/global';
import { PAGES } from '@/app/utils/constants';

import type { PriceRange } from '../server/products/getProductsPriceRange';
import { updateUserState } from '../server/users/updateUserState';
import { getApi } from './api';

interface BlockByMarkerProps {
  marker: string;
}

interface BlocksByPageUrlProps {
  pageUrl: string;
}

interface SingleOrderProps {
  marker: string;
  id: number;
  body: IOrderData;
}

export const RTKApi = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  keepUnusedDataFor: 300,
  tagTypes: ['Products', 'Pages', 'Blocks', 'Forms', 'Orders', 'User', 'Accounts', 'Sessions'],
  endpoints: build => ({
    /** getBlocksByPageUrl — all blocks for the given page url. */
    getBlocksByPageUrl: build.query<IPositionBlock[], BlocksByPageUrlProps>({
      queryFn: async ({ pageUrl }) => {
        const result = await getApi().Pages.getBlocksByPageUrl(pageUrl);
        if (isError(result)) {
          return { error: result };
        }
        return { data: result as IPositionBlock[] };
      },
      providesTags: ['Blocks'],
      keepUnusedDataFor: 600,
    }),
    /** getProducts — products with filter. */
    getProducts: build.query<IProductsResponse, { body: [] }>({
      queryFn: async ({ body }) => {
        const result = await getApi().Products.getProducts(body);
        if (isError(result)) {
          return { error: result };
        }
        return { data: result as IProductsResponse };
      },
      providesTags: ['Products'],
      keepUnusedDataFor: 300,
    }),
    /** getProductsByPageUrl — products by pageUrl. */
    getProductsByPageUrl: build.query<IProductsResponse, { url: string }>({
      queryFn: async ({ url }) => {
        if (!url) {
          return { error: null };
        }
        const result = await getApi().Products.getProductsByPageUrl(url);
        if (isError(result)) {
          return { error: result };
        }
        return { data: result as IProductsResponse };
      },
      providesTags: ['Products'],
      keepUnusedDataFor: 300,
    }),
    /** getProductsByIds — products by an array of ids. */
    getProductsByIds: build.query<IProductsEntity[], { items: number[] }>({
      queryFn: async ({ items }) => {
        const getProductsByIds = async (ids: number[]) => {
          return await Promise.all(
            ids.map(async (id: number) => {
              const product = await getApi().Products.getProductById(id);
              if (!product || (product as IError).statusCode >= 400) {
                return undefined;
              } else {
                return product as IProductsEntity;
              }
            })
          ).then(results => {
            return results.filter((product): product is IProductsEntity => product !== undefined);
          });
        };

        const result = await getProductsByIds(items.map(item => item)).then(res => res);

        if (isError(result)) {
          return { error: 'Data error' };
        }
        return { data: result };
      },
      providesTags: ['Products'],
      keepUnusedDataFor: 300,
    }),
    /** getProductById — product by id. */
    getProductById: build.query<IProductsEntity, { id: number }>({
      queryFn: async ({ id }) => {
        if (!id) {
          return { error: null };
        }
        const result = await getApi().Products.getProductById(id);
        if (isError(result)) {
          return { error: result };
        }
        return { data: result as IProductsEntity };
      },
      providesTags: ['Products'],
      keepUnusedDataFor: 300,
    }),

    /** getPageById — page by id. */
    getPageById: build.query<IPagesEntity, { id: number }>({
      queryFn: async ({ id }) => {
        if (!id) {
          return { error: null };
        }
        const result = await getApi().Pages.getPageById(id);

        if (isError(result)) {
          return { error: result };
        }
        return { data: result as IPagesEntity };
      },
      providesTags: ['Pages'],
      keepUnusedDataFor: 600,
    }),

    /** getBlockByMarker — block by marker. */
    getBlockByMarker: build.query<IBlockEntity, BlockByMarkerProps>({
      queryFn: async ({ marker }) => {
        const result = await getApi().Blocks.getBlockByMarker(marker);
        if (isError(result)) {
          return { error: result };
        }
        return { data: result as IBlockEntity };
      },
      providesTags: ['Blocks'],
      keepUnusedDataFor: 600,
    }),
    /** getAuthProviders — all auth provider entities. */
    getAuthProviders: build.query<IAuthProvidersEntity[], string>({
      queryFn: async () => {
        const result = await getApi().AuthProvider.getAuthProviders();
        if (isError(result)) {
          return { error: result };
        }
        return { data: result as IAuthProvidersEntity[] };
      },
      keepUnusedDataFor: 3600,
    }),
    /** getFormByMarker — form by marker. */
    getFormByMarker: build.query<IFormsEntity, { marker: string }>({
      queryFn: async ({ marker }) => {
        const result = await getApi().Forms.getFormByMarker(marker);
        if (isError(result)) {
          return { error: result };
        }
        return { data: result as IFormsEntity };
      },
      providesTags: ['Forms'],
      keepUnusedDataFor: 600,
    }),
    /** getMenuByMarker — client-side counterpart of the server `getMenuByMarker` (profile dropdown etc.). */
    getMenuByMarker: build.query<IMenusEntity, { marker: string }>({
      queryFn: async ({ marker }) => {
        const result = await getApi().Menus.getMenusByMarker(marker);
        if (isError(result)) {
          return { error: result };
        }
        return { data: result as IMenusEntity };
      },
      keepUnusedDataFor: 600,
    }),
    /** getChildPagesByParentUrl — client-side counterpart of the server `getChildPagesByParentUrl` (lazy-loading lists of pages in popups). */
    getChildPagesByParentUrl: build.query<IPagesEntity[], { url: string }>({
      queryFn: async ({ url }) => {
        const result = await getApi().Pages.getChildPagesByParentUrl(url);
        if (isError(result)) {
          return { error: result };
        }
        return { data: result as IPagesEntity[] };
      },
      providesTags: ['Pages'],
      keepUnusedDataFor: 600,
    }),
    /** getProductsPriceRange — catalog min/max price (lazy-fetched on filter popup open). */
    getProductsPriceRange: build.query<PriceRange, { pageUrl?: string }>({
      queryFn: async ({ pageUrl = PAGES.services }) => {
        try {
          const result = await getApi().Products.getProductsPriceByPageUrl(pageUrl);
          if (isError(result)) {
            return { data: { min: 0, max: 0 } };
          }
          const prices = result.items
            .map(item => Number(item.price))
            .filter(p => Number.isFinite(p) && p > 0);
          if (prices.length === 0) {
            return { data: { min: 0, max: 0 } };
          }
          return {
            data: {
              min: Math.floor(Math.min(...prices)),
              max: Math.ceil(Math.max(...prices)),
            },
          };
        } catch {
          return { data: { min: 0, max: 0 } };
        }
      },
      providesTags: ['Products'],
      keepUnusedDataFor: 600,
    }),
    /** getMe — data of the currently authenticated user. */
    getMe: build.query<IUserEntity, string>({
      queryFn: async () => {
        const result = await getApi().Users.getUser();
        if (isError(result)) {
          return { error: result };
        }
        return { data: result as IUserEntity };
      },
      providesTags: ['User'],
      keepUnusedDataFor: 60,
    }),
    /** getBonusBalance — current user's bonus balance (requires auth). */
    getBonusBalance: build.query<IBonusBalanceEntity, void>({
      queryFn: async () => {
        const result = await getApi().Discounts.getBonusBalance();
        if (isError(result)) {
          return { error: result };
        }
        return { data: result as IBonusBalanceEntity };
      },
      providesTags: ['User'],
      keepUnusedDataFor: 60,
    }),
    /** getBonusHistory — current user's bonus transaction history (requires auth). */
    getBonusHistory: build.query<IBonusTransactionEntity[], void>({
      queryFn: async () => {
        const result = await getApi().Discounts.getBonusHistory();
        if (isError(result)) {
          return { error: result };
        }
        return { data: result as IBonusTransactionEntity[] };
      },
      providesTags: ['User'],
      keepUnusedDataFor: 60,
    }),
    /** getAccounts — all payment accounts. */
    getAccounts: build.query<IAccountsEntity[], object>({
      queryFn: async () => {
        const result = await getApi().Payments.getAccounts();
        if (isError(result)) {
          return { error: result };
        }
        return { data: result as IAccountsEntity[] };
      },
      providesTags: ['Accounts'],
      keepUnusedDataFor: 300,
    }),
    /** getOrderStorageByMarker — order-storage entity by marker. */
    getOrderStorageByMarker: build.query<IOrdersEntity, { marker: string }>({
      queryFn: async ({ marker }) => {
        const result = await getApi().Orders.getOrdersStorageByMarker(marker);
        if (isError(result)) {
          return { error: result };
        }
        return { data: result as IOrdersEntity };
      },
      providesTags: ['Orders'],
      keepUnusedDataFor: 60,
    }),
    /** getPaymentSessionById — payment session by id. */
    getPaymentSessionById: build.query<ISessionEntity, { id: number }>({
      queryFn: async ({ id }) => {
        const result = await getApi().Payments.getSessionById(id);
        if (isError(result)) {
          return { error: result };
        }
        return { data: result as ISessionEntity };
      },
      providesTags: ['Sessions'],
      keepUnusedDataFor: 60,
    }),
    /** getSingleOrder — a single order from the user's order-storage. */
    getSingleOrder: build.query<IOrderByMarkerEntity, SingleOrderProps>({
      queryFn: async ({ id, marker }) => {
        const result = await getApi().Orders.getOrderByMarkerAndId(marker, id);
        if (isError(result)) {
          return { error: result };
        }
        return { data: result as IOrderByMarkerEntity };
      },
      providesTags: ['Orders'],
      keepUnusedDataFor: 60,
    }),
    /** updateOrderByMarkerAndId — updates a single order in the user's order-storage. */
    updateOrderByMarkerAndId: build.query<IBaseOrdersEntity, SingleOrderProps>({
      queryFn: async ({ id, marker, body }) => {
        const result = await getApi().Orders.updateOrderByMarkerAndId(marker, id, body);
        if (isError(result)) {
          return { error: result };
        }
        return { data: result as IBaseOrdersEntity };
      },
      providesTags: ['Orders'],
      keepUnusedDataFor: 60,
    }),
    /** updateUserState — updates the user's state. */
    updateUserState: build.mutation<
      boolean,
      { favorites: number[]; cart: IProducts[]; user: IUserEntity | undefined }
    >({
      queryFn: async ({ favorites, cart, user }) => {
        const result = await updateUserState({ favorites, cart, user });
        if (result === undefined) {
          return { data: false };
        }
        return { data: result };
      },
      invalidatesTags: ['User'],
    }),
    /** updateOrder — updates an order. */
    updateOrder: build.mutation<IBaseOrdersEntity, SingleOrderProps>({
      queryFn: async ({ id, marker, body }) => {
        const result = await getApi().Orders.updateOrderByMarkerAndId(marker, id, body);
        if (isError(result)) {
          return { error: result };
        }
        return { data: result as IBaseOrdersEntity };
      },
      invalidatesTags: ['Orders'],
    }),
  }),
});

export const {
  useGetBlockByMarkerQuery,
  useGetBlocksByPageUrlQuery,
  useGetChildPagesByParentUrlQuery,
  useGetFormByMarkerQuery,
  useGetMenuByMarkerQuery,
  useGetAuthProvidersQuery,
  useLazyGetMeQuery,
  useGetAccountsQuery,
  useGetBonusBalanceQuery,
  useGetBonusHistoryQuery,
  useGetPageByIdQuery,
  useGetPaymentSessionByIdQuery,
  useLazyGetPaymentSessionByIdQuery,
  useGetOrderStorageByMarkerQuery,
  useGetSingleOrderQuery,
  useGetProductByIdQuery,
  useGetProductsQuery,
  useGetProductsByPageUrlQuery,
  useGetProductsByIdsQuery,
  useGetProductsPriceRangeQuery,
  useUpdateOrderByMarkerAndIdQuery,
  useUpdateUserStateMutation,
  useUpdateOrderMutation,
} = RTKApi;
