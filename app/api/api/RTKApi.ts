/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type { IAuthProvidersEntity } from 'oneentry/dist/auth-provider/authProvidersInterfaces';
import type { IError } from 'oneentry/dist/base/utils';
import type { IBlockEntity } from 'oneentry/dist/blocks/blocksInterfaces';
import type { IFormsEntity } from 'oneentry/dist/forms/formsInterfaces';
import type { IMenusEntity } from 'oneentry/dist/menus/menusInterfaces';
import type {
  IBaseOrdersEntity,
  IOrderByMarkerEntity,
  IOrdersEntity,
} from 'oneentry/dist/orders/ordersInterfaces';
import type {
  IPagesEntity,
  IPositionBlock,
} from 'oneentry/dist/pages/pagesInterfaces';
import type {
  IAccountsEntity,
  ISessionEntity,
} from 'oneentry/dist/payments/paymentsInterfaces';
import type {
  IProductsEntity,
  IProductsResponse,
} from 'oneentry/dist/products/productsInterfaces';
import type { IUserEntity } from 'oneentry/dist/users/usersInterfaces';

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
  body: any;
}

export const RTKApi = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  keepUnusedDataFor: 300, // 5 минут по умолчанию
  tagTypes: [
    'Products',
    'Pages',
    'Blocks',
    'Forms',
    'Orders',
    'User',
    'Accounts',
    'Sessions',
  ],
  endpoints: (build) => ({
    /**
     * Получает все блоки по url страницы.
     * @property {string} pageUrl - Маркер блока.
     */
    getBlocksByPageUrl: build.query<IPositionBlock[], BlocksByPageUrlProps>({
      queryFn: async ({ pageUrl }) => {
        const result = await getApi().Pages.getBlocksByPageUrl(pageUrl);
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IPositionBlock[] };
      },
      providesTags: ['Blocks'],
      keepUnusedDataFor: 600, // 10 минут для блоков
    }),
    /**
     * Получает продукты с фильтром.
     * @property {IProductsEntity[]} item - IProductsEntity.
     */
    getProducts: build.query<IProductsResponse, { body: [] }>({
      queryFn: async ({ body }) => {
        const result = await getApi().Products.getProducts(body);
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IProductsResponse };
      },
      providesTags: ['Products'],
      keepUnusedDataFor: 300, // 5 минут для продуктов
    }),
    /**
     * Получает продукты по PageUrl.
     * @property {IProductsEntity[]} item - IProductsEntity.
     */
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
      keepUnusedDataFor: 300, // 5 минут для продуктов по URL
    }),
    /**
     * Получает продукты по идентификаторам.
     * @property {IProductsEntity[]} items - Массив IProductsEntity.
     */
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
            }),
          ).then((results) => {
            return results.filter(
              (product): product is IProductsEntity => product !== undefined,
            );
          });
        };

        const result = await getProductsByIds(items.map((item) => item)).then(
          (res) => res,
        );

        if (typeError(result)) {
          return { error: 'Data error' };
        }
        return { data: result };
      },
      providesTags: ['Products'],
      keepUnusedDataFor: 300, // 5 минут для продуктов по ID
    }),
    /**
     * Получает продукт по id.
     * @property {number} id - id продукта.
     */
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
      keepUnusedDataFor: 300, // 5 минут для отдельного продукта
    }),

    /**
     * Получает страницу по id.
     * @property {IProductsEntity} item - IProductsEntity.
     */
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
      keepUnusedDataFor: 600, // 10 минут для страниц
    }),

    /**
     * Получает блок по маркеру.
     * @property {string} marker - Маркер блока.
     */
    getBlockByMarker: build.query<IBlockEntity, BlockByMarkerProps>({
      queryFn: async ({ marker }) => {
        const result = await getApi().Blocks.getBlockByMarker(marker);
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IBlockEntity };
      },
      providesTags: ['Blocks'],
      keepUnusedDataFor: 600, // 10 минут для блоков
    }),
    /**
     * Получает все объекты провайдеров авторизации.
     */
    getAuthProviders: build.query<IAuthProvidersEntity[], string>({
      queryFn: async () => {
        const result = await getApi().AuthProvider.getAuthProviders();
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IAuthProvidersEntity[] };
      },
      keepUnusedDataFor: 3600, // 1 час для провайдеров авторизации
    }),
    /**
     * Получает форму по маркеру.
     * @property {string} marker - Маркер формы.
     */
    getFormByMarker: build.query<IFormsEntity, { marker: string }>({
      queryFn: async ({ marker }) => {
        const result = await getApi().Forms.getFormByMarker(marker);
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IFormsEntity };
      },
      providesTags: ['Forms'],
      keepUnusedDataFor: 600, // 10 минут для форм
    }),
    /**
     * Получает меню по маркеру — клиентский аналог server-функции
     * `getMenuByMarker`. Используется в выпадающих UI-меню (например,
     * dropdown профиля по маркеру `user_menu`).
     */
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
    /**
     * Получает дочерние страницы по url родителя — клиентский аналог
     * server-функции `getChildPagesByParentUrl`. Используется в попапах,
     * которые подгружают список страниц лениво (например, выпадающий
     * список ресторанов в ReservationPopup).
     * @property {string} url - pageUrl родительской страницы.
     */
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
    /**
     * Получение данных авторизованного пользователя.
     */
    getMe: build.query<IUserEntity, string>({
      queryFn: async () => {
        const result = await getApi().Users.getUser();
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IUserEntity };
      },
      providesTags: ['User'],
      keepUnusedDataFor: 60, // 1 минута для данных пользователя
    }),
    /**
     * Получает все платёжные аккаунты в виде массива.
     */
    getAccounts: build.query<IAccountsEntity[], object>({
      queryFn: async () => {
        const result = await getApi().Payments.getAccounts();
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IAccountsEntity[] };
      },
      providesTags: ['Accounts'],
      keepUnusedDataFor: 300, // 5 минут для аккаунтов
    }),
    /**
     * Получает один объект хранилища заказов по маркеру.
     * @property {string} marker - Маркер объекта заказа.
     */
    getOrderStorageByMarker: build.query<IOrdersEntity, { marker: string }>({
      queryFn: async ({ marker }) => {
        const result = await getApi().Orders.getOrdersStorageByMarker(marker);
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IOrdersEntity };
      },
      providesTags: ['Orders'],
      keepUnusedDataFor: 60, // 1 минута для заказов
    }),
    /**
     * Получает один объект платёжной сессии по его идентификатору.
     * @property {number} id - Идентификатор получаемого объекта платёжной сессии.
     */
    getPaymentSessionById: build.query<ISessionEntity, { id: number }>({
      queryFn: async ({ id }) => {
        const result = await getApi().Payments.getSessionById(id);
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as ISessionEntity };
      },
      providesTags: ['Sessions'],
      keepUnusedDataFor: 60, // 1 минута для сессий
    }),
    /**
     * Получение одного заказа из объекта хранилища заказов, созданного пользователем.
     * @property {number} id - ID объекта заказа.
     * @property {string} marker - Текстовый идентификатор объекта хранилища заказов.
     */
    getSingleOrder: build.query<IOrderByMarkerEntity, SingleOrderProps>({
      queryFn: async ({ id, marker }) => {
        const result = await getApi().Orders.getOrderByMarkerAndId(marker, id);
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IOrderByMarkerEntity };
      },
      providesTags: ['Orders'],
      keepUnusedDataFor: 60, // 1 минута для отдельных заказов
    }),
    /**
     * Обновление одного заказа из объекта хранилища заказов, созданного пользователем.
     * @property {number} id - ID объекта заказа.
     * @property {string} marker - Текстовый идентификатор объекта хранилища заказов.
     * @property {any} data - Данные объекта хранилища заказов.
     */
    updateOrderByMarkerAndId: build.query<IBaseOrdersEntity, SingleOrderProps>({
      queryFn: async ({ id, marker, body }) => {
        const result = await getApi().Orders.updateOrderByMarkerAndId(
          marker,
          id,
          body,
        );
        if (typeError(result)) {
          return { error: result };
        }
        return { data: result as IBaseOrdersEntity };
      },
      providesTags: ['Orders'],
      keepUnusedDataFor: 60, // 1 минута для обновленных заказов
    }),
    /**
     * Обновляет состояние пользователя.
     */
    // eslint-disable-next-line prettier/prettier
    updateUserState: build.mutation<boolean, { favorites: number[], cart: any; user: any }>({
      queryFn: async ({ favorites, cart, user }) => {
        const result = await updateUserState({ favorites, cart, user });
        if (result === undefined) {
          return { data: false };
        }
        return { data: result };
      },
      invalidatesTags: ['User'],
    }),
    /**
     * Обновляет заказ.
     */
    updateOrder: build.mutation<IBaseOrdersEntity, SingleOrderProps>({
      queryFn: async ({ id, marker, body }) => {
        const result = await getApi().Orders.updateOrderByMarkerAndId(
          marker,
          id,
          body,
        );
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
