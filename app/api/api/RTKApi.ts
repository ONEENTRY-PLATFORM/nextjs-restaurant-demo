import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type { IAuthProvidersEntity } from 'oneentry/dist/auth-provider/authProvidersInterfaces';
import type { IError } from 'oneentry/dist/base/utils';
import type { IBlockEntity } from 'oneentry/dist/blocks/blocksInterfaces';
import type { IFormsEntity } from 'oneentry/dist/forms/formsInterfaces';
import type { IMenusEntity } from 'oneentry/dist/menus/menusInterfaces';
import type {
  IBaseOrdersEntity,
  IOrderByMarkerEntity,
  IOrderData,
  IOrdersEntity,
} from 'oneentry/dist/orders/ordersInterfaces';
import type { IPagesEntity, IPositionBlock } from 'oneentry/dist/pages/pagesInterfaces';
import type { IAccountsEntity, ISessionEntity } from 'oneentry/dist/payments/paymentsInterfaces';
import type { IProductsEntity, IProductsResponse } from 'oneentry/dist/products/productsInterfaces';
import type { IUserEntity } from 'oneentry/dist/users/usersInterfaces';

import type { IProducts } from '@/app/types/global';
import { typeError } from '@/components/utils';

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
    /** getBlocksByPageUrl — все блоки по url страницы. */
    getBlocksByPageUrl: build.query<IPositionBlock[], BlocksByPageUrlProps>({
      queryFn: async ({ pageUrl }) => {
        const result = await getApi().Pages.getBlocksByPageUrl(pageUrl);
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IPositionBlock[] };
      },
      providesTags: ['Blocks'],
      keepUnusedDataFor: 600,
    }),
    /** getProducts — продукты с фильтром. */
    getProducts: build.query<IProductsResponse, { body: [] }>({
      queryFn: async ({ body }) => {
        const result = await getApi().Products.getProducts(body);
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IProductsResponse };
      },
      providesTags: ['Products'],
      keepUnusedDataFor: 300,
    }),
    /** getProductsByPageUrl — продукты по pageUrl. */
    getProductsByPageUrl: build.query<IProductsResponse, { url: string }>({
      queryFn: async ({ url }) => {
        if (!url) {
          return { error: null };
        }
        const result = await getApi().Products.getProductsByPageUrl(url);
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IProductsResponse };
      },
      providesTags: ['Products'],
      keepUnusedDataFor: 300,
    }),
    /** getProductsByIds — продукты по массиву id. */
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

        if (typeError(result)) {
          return { error: 'Data error' };
        }
        return { data: result };
      },
      providesTags: ['Products'],
      keepUnusedDataFor: 300,
    }),
    /** getProductById — продукт по id. */
    getProductById: build.query<IProductsEntity, { id: number }>({
      queryFn: async ({ id }) => {
        if (!id) {
          return { error: null };
        }
        const result = await getApi().Products.getProductById(id);
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IProductsEntity };
      },
      providesTags: ['Products'],
      keepUnusedDataFor: 300,
    }),

    /** getPageById — страница по id. */
    getPageById: build.query<IPagesEntity, { id: number }>({
      queryFn: async ({ id }) => {
        if (!id) {
          return { error: null };
        }
        const result = await getApi().Pages.getPageById(id);

        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IPagesEntity };
      },
      providesTags: ['Pages'],
      keepUnusedDataFor: 600,
    }),

    /** getBlockByMarker — блок по маркеру. */
    getBlockByMarker: build.query<IBlockEntity, BlockByMarkerProps>({
      queryFn: async ({ marker }) => {
        const result = await getApi().Blocks.getBlockByMarker(marker);
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IBlockEntity };
      },
      providesTags: ['Blocks'],
      keepUnusedDataFor: 600,
    }),
    /** getAuthProviders — все объекты auth-провайдеров. */
    getAuthProviders: build.query<IAuthProvidersEntity[], string>({
      queryFn: async () => {
        const result = await getApi().AuthProvider.getAuthProviders();
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IAuthProvidersEntity[] };
      },
      keepUnusedDataFor: 3600,
    }),
    /** getFormByMarker — форма по маркеру. */
    getFormByMarker: build.query<IFormsEntity, { marker: string }>({
      queryFn: async ({ marker }) => {
        const result = await getApi().Forms.getFormByMarker(marker);
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IFormsEntity };
      },
      providesTags: ['Forms'],
      keepUnusedDataFor: 600,
    }),
    /** getMenuByMarker — клиентский аналог серверного `getMenuByMarker` (профильный dropdown и т.п.). */
    getMenuByMarker: build.query<IMenusEntity, { marker: string }>({
      queryFn: async ({ marker }) => {
        const result = await getApi().Menus.getMenusByMarker(marker);
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IMenusEntity };
      },
      keepUnusedDataFor: 600,
    }),
    /** getChildPagesByParentUrl — клиентский аналог серверного `getChildPagesByParentUrl` (lazy-загрузка списка страниц в попапах). */
    getChildPagesByParentUrl: build.query<IPagesEntity[], { url: string }>({
      queryFn: async ({ url }) => {
        const result = await getApi().Pages.getChildPagesByParentUrl(url);
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IPagesEntity[] };
      },
      providesTags: ['Pages'],
      keepUnusedDataFor: 600,
    }),
    /** getMe — данные авторизованного пользователя. */
    getMe: build.query<IUserEntity, string>({
      queryFn: async () => {
        const result = await getApi().Users.getUser();
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IUserEntity };
      },
      providesTags: ['User'],
      keepUnusedDataFor: 60,
    }),
    /** getAccounts — все payment-аккаунты. */
    getAccounts: build.query<IAccountsEntity[], object>({
      queryFn: async () => {
        const result = await getApi().Payments.getAccounts();
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IAccountsEntity[] };
      },
      providesTags: ['Accounts'],
      keepUnusedDataFor: 300,
    }),
    /** getOrderStorageByMarker — объект order-storage по маркеру. */
    getOrderStorageByMarker: build.query<IOrdersEntity, { marker: string }>({
      queryFn: async ({ marker }) => {
        const result = await getApi().Orders.getOrdersStorageByMarker(marker);
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IOrdersEntity };
      },
      providesTags: ['Orders'],
      keepUnusedDataFor: 60,
    }),
    /** getPaymentSessionById — payment-сессия по id. */
    getPaymentSessionById: build.query<ISessionEntity, { id: number }>({
      queryFn: async ({ id }) => {
        const result = await getApi().Payments.getSessionById(id);
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as ISessionEntity };
      },
      providesTags: ['Sessions'],
      keepUnusedDataFor: 60,
    }),
    /** getSingleOrder — один заказ из order-storage пользователя. */
    getSingleOrder: build.query<IOrderByMarkerEntity, SingleOrderProps>({
      queryFn: async ({ id, marker }) => {
        const result = await getApi().Orders.getOrderByMarkerAndId(marker, id);
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IOrderByMarkerEntity };
      },
      providesTags: ['Orders'],
      keepUnusedDataFor: 60,
    }),
    /** updateOrderByMarkerAndId — обновляет один заказ в order-storage пользователя. */
    updateOrderByMarkerAndId: build.query<IBaseOrdersEntity, SingleOrderProps>({
      queryFn: async ({ id, marker, body }) => {
        const result = await getApi().Orders.updateOrderByMarkerAndId(marker, id, body);
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IBaseOrdersEntity };
      },
      providesTags: ['Orders'],
      keepUnusedDataFor: 60,
    }),
    /** updateUserState — обновляет state пользователя. */
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
    /** updateOrder — обновляет заказ. */
    updateOrder: build.mutation<IBaseOrdersEntity, SingleOrderProps>({
      queryFn: async ({ id, marker, body }) => {
        const result = await getApi().Orders.updateOrderByMarkerAndId(marker, id, body);
        if (typeError(result)) {
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
  useGetPageByIdQuery,
  useGetPaymentSessionByIdQuery,
  useLazyGetPaymentSessionByIdQuery,
  useGetOrderStorageByMarkerQuery,
  useGetSingleOrderQuery,
  useGetProductByIdQuery,
  useGetProductsQuery,
  useGetProductsByPageUrlQuery,
  useGetProductsByIdsQuery,
  useUpdateOrderByMarkerAndIdQuery,
  useUpdateUserStateMutation,
  useUpdateOrderMutation,
} = RTKApi;
