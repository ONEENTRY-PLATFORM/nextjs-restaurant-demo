/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useState } from 'react';

import { getApi, useGetProductsByIdsQuery } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import {
  addDeliveryToCart,
  addProductsToCart,
  removeProduct,
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
 * Страница корзины
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

  // Зеркалим состояние доставки корзины в OrderSlice.formData, чтобы submit
  // на шаге `payment` всё равно имел `delivery_time` / `delivery_address`,
  // даже хотя legacy DeliveryForm не рендерится (по cart_cart.html /
  // pk_cart.html — на экране корзины только продукты и APPLY).
  useEffect(() => {
    const date = cartDelivery.date;
    const time = cartDelivery.time;
    const addressReg =
      user?.formData.find((el) => el.marker === 'address_reg')?.value ?? '';
    const address = (cartDelivery.address as string | undefined) || addressReg;

    // OneEntry требует для `timeInterval` value формы массив пар
    // `[[startISO, endISO]]` (см. SDK skill `create-checkout`). TimePickerSheet
    // отдаёт 1-часовой слот в формате `HH.00`/`HH:MM`, поэтому собираем интервал
    // [hour, hour+1) на выбранном дне.
    const hourMatch =
      typeof time === 'string' ? time.match(/^(\d{1,2})/) : null;
    const hour = hourMatch?.[1] ? parseInt(hourMatch[1], 10) : NaN;
    if (date && Number.isFinite(hour)) {
      const start = new Date(date);
      start.setUTCHours(hour, 0, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      dispatch(
        addData({
          marker: 'delivery_time',
          type: 'timeInterval',
          value: [[start.toISOString(), end.toISOString()]],
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

  // продукты в redux carSlice
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productsCartData = useAppSelector(selectCartData) as any[];

  // Получаем продукты по Ids из api
  const { data, isLoading } = useGetProductsByIdsQuery({
    items: productsCartData.map((p) => p.id),
  });

  // добавляем deliveryData
  useEffect(() => {
    if (deliveryData) {
      dispatch(addDeliveryToCart(deliveryData));
    }
  }, [deliveryData]);

  // Чистим stale id из persist-корзины: если в OneEntry продукта больше нет
  // (404 в `getProductsByIds`), он не попадает в `data` — соответствующий
  // entry в `productsData` навсегда останется в localStorage и при каждом
  // маунте будет шуметь в network 404'ом. Удаляем такие записи разово после
  // загрузки.
  useEffect(() => {
    if (!data) return;
    const returnedIds = new Set(data.map((p: IProductsEntity) => p.id));
    for (const entry of productsCartData) {
      if (!returnedIds.has(entry.id)) {
        dispatch(removeProduct(entry.id));
      }
    }
  }, [data]);

  // добавляем продукты в slice корзины
  useEffect(() => {
    // Проверяем, есть ли данные для установки продуктов
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts(data); // Инициализируем стейт продуктов полученными данными

      // Если пользователь авторизован, устанавливаем WebSocket-соединение
      if (isAuth) {
        const ws = getApi().WS.connect(); // Подключаемся к WebSocket
        if (ws) {
          // Слушаем события 'notification' из WebSocket
          ws.on('notification', async (res) => {
            if (res?.product) {
              // Подготавливаем объект продукта с дополнительными значениями атрибутов
              const product = {
                ...res.product,
                attributeValues: res.product?.attributes,
              };

              // Находим индекс продукта в текущем массиве данных
              const index = data.findIndex(
                (p: IProductsEntity) => p.id === product.id,
              );

              // Парсим новую цену из ответа уведомления
              const newPrice = parseInt(
                product?.attributeValues?.price?.value,
                10,
              );

              // Обновляем стейт продуктов с новой ценой и статусом
              setProducts((prevProducts) => {
                // Создаём копию текущих продуктов
                const newProducts = [...prevProducts];
                if (newProducts[index]) {
                  newProducts[index] = {
                    ...newProducts[index], // Сохраняем существующие свойства продукта
                    price: newPrice, // Обновляем цену новым значением
                    statusIdentifier: res?.product?.status?.identifier, // Обновляем идентификатор статуса
                  };
                }
                return newProducts; // Возвращаем обновлённый массив продуктов
              });
            }
          });

          // Cleanup-функция для отключения WebSocket при размонтировании компонента или изменении зависимостей
          return () => {
            ws.disconnect();
          };
        }
      }
    }
    return undefined;
    // Массив зависимостей: эффект будет выполнен при изменении 'data'
  }, [data]);

  // обновляем продукты в корзине
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
          // Ищем selection по id, а не по индексу — `productsCartData` может
          // быть в другом порядке, чем `products` (порядок ответа RTK query
          // не гарантирован), и изменение `selected` одной записи мутирует
          // ссылку массива, так что lookup по индексу рассинхронизируется.
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
