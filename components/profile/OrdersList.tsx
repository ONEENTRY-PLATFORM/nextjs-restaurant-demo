'use client';

import Image from 'next/image';
import Link from 'next/link';
import type {
  IOrderByMarkerEntity,
  IOrderProducts,
} from 'oneentry/dist/orders/ordersInterfaces';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useMemo, useState } from 'react';

import type { BlogBanner } from '@/app/api';
import { getAllOrdersByMarker, useGetProductsByIdsQuery } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { formatDate } from '@/app/utils/formatDate';
import { UsePrice } from '@/components/utils';

const HISTORY_STATUSES = new Set([
  'delivered',
  'canceled',
  'cancelled',
  'completed',
  'rejected',
]);

/**
 * Возвращает читаемый статус заказа, отдавая приоритет локализованной информации из CMS.
 * @param   {IOrderByMarkerEntity} o - Сущность заказа.
 * @returns {string}                  Отображаемая подпись.
 */
const statusLabel = (o: IOrderByMarkerEntity): string => {
  const localized = (o.statusLocalizeInfos as { title?: string } | undefined)
    ?.title;
  if (localized) return localized;
  const id = o.statusIdentifier;
  if (!id) return '—';
  return id.replace(/_/g, ' ').replace(/(^|\s)\S/g, (c) => c.toUpperCase());
};

/**
 * Должен ли заказ попасть в группу "Orders History" вместо
 * "Active orders".
 * @param   {IOrderByMarkerEntity} o - Сущность заказа.
 * @returns {boolean}                 True, если заказ завершён или отменён.
 */
const isHistoryOrder = (o: IOrderByMarkerEntity): boolean => {
  if (o.isCompleted === true) return true;
  return HISTORY_STATUSES.has((o.statusIdentifier ?? '').toLowerCase());
};

/**
 * Считает subtotal / delivery / total для заказа. Subtotal — сумма
 * позиций; delivery — остаток между `totalSum` заказа и subtotal
 * (обрезается до 0).
 * @param   {IOrderByMarkerEntity} o - Сущность заказа.
 * @returns {{ subtotal: number; delivery: number; total: number }} Итоги.
 */
const computeTotals = (
  o: IOrderByMarkerEntity,
): { subtotal: number; delivery: number; total: number } => {
  const subtotal = o.products.reduce(
    (s, p) => s + Number(p.price) * Number(p.quantity),
    0,
  );
  const total = Number(o.totalSum) || subtotal;
  const delivery = Math.max(0, total - subtotal);
  return { subtotal, delivery, total };
};

/**
 * Форматирует номер заказа как в static-html (`№OE...`). Возвращает чистый
 * числовой id, если SDK не предоставляет отформатированный код.
 * @param   {IOrderByMarkerEntity} o - Сущность заказа.
 * @returns {string}                  Отображаемый номер.
 */
const formatOrderNumber = (o: IOrderByMarkerEntity): string => {
  const fromSdk = (o as unknown as { orderId?: string }).orderId;
  if (fromSdk) return fromSdk;
  return String(o.id);
};

/**
 * Одна строка: pill со сводкой заказа + раскрывающееся тело с позициями,
 * итогами и CTA. Повторяет `pk_active_orders.html`.
 * @param   {object}              props          - Пропсы карточки.
 * @param   {IOrderByMarkerEntity} props.order   - Сущность заказа.
 * @param   {boolean}             props.expanded - Раскрыто ли тело.
 * @param   {() => void}          props.onToggle - Обработчик переключения.
 * @param   {boolean}             props.isHistory- Рендерить ли CTA Repeat
 *                                                 только для истории
 *                                                 (вместо активного CTA
 *                                                 "Contact with the courier").
 * @returns {JSX.Element}                         JSX карточки.
 */
const OrderCard = ({
  order,
  expanded,
  onToggle,
  isHistory,
  productsById,
}: {
  order: IOrderByMarkerEntity;
  expanded: boolean;
  onToggle: () => void;
  isHistory: boolean;
  productsById: Map<number, IProductsEntity>;
}): JSX.Element => {
  const { subtotal, delivery, total } = computeTotals(order);
  const created = (order as unknown as { createdDate?: string }).createdDate;
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="mt-2.75 flex w-full items-center justify-between gap-2 rounded-[5px] bg-custom_gray_pk px-3.75 py-1.5 text-sm text-white lg:text-base"
      >
        <p className="font-bold">№{formatOrderNumber(order)}</p>
        <p>{statusLabel(order)}</p>
        <p>{formatDate(created)}</p>
        <Image
          src="/images/icons/chevron-up.svg"
          alt=""
          width={12}
          height={7}
          className={
            'transition-transform duration-200 ' +
            (expanded ? '' : 'rotate-180')
          }
        />
      </button>
      {expanded && (
        <>
          {!isHistory && (
            <button
              type="button"
              className="mt-5 block w-52.5 rounded-[5px] bg-brand px-3.75 py-1.5 text-base text-white hover_btn_transp"
            >
              Contact with the courier
            </button>
          )}
          <div className="mt-5 flex flex-col">
            {order.products.map((p, idx) => (
              <OrderLineItem
                key={`${p.id}-${idx}`}
                product={p}
                first={idx === 0}
                fullProduct={productsById.get(p.id)}
              />
            ))}
            <div className="mt-5 flex items-center justify-between rounded-[5px] border border-brand p-2.5">
              <div>
                <div className="flex gap-1.25 text-white">
                  <p>Subtotal:</p>
                  <p>{UsePrice({ amount: subtotal })}</p>
                </div>
                <div className="flex gap-1.25 text-brand">
                  <p>Delivery:</p>
                  <p>{UsePrice({ amount: delivery })}</p>
                </div>
              </div>
              <div className="flex gap-3.75 text-xl font-bold text-white">
                <p>Total Amount:</p>
                <p>{UsePrice({ amount: total })}</p>
              </div>
            </div>
            {isHistory && (
              <button
                type="button"
                className="mt-5 block w-32.5 rounded-[5px] bg-brand px-3.75 py-1.5 text-base text-ink hover_btn_transp"
              >
                Repeat order
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Одна строка позиции внутри раскрытого тела заказа.
 * @param   {object}         props         - Пропсы строки.
 * @param   {IOrderProducts} props.product - Позиция заказа.
 * @param   {boolean}        props.first   - Является ли это первой строкой
 *                                           (без верхнего отступа).
 * @returns {JSX.Element}                  JSX строки.
 */
const OrderLineItem = ({
  product,
  first,
  fullProduct,
}: {
  product: IOrderProducts;
  first: boolean;
  fullProduct?: IProductsEntity | undefined;
}): JSX.Element => {
  // `previewImage` в snapshot заказа часто null (зависит от настроек CMS на момент
  // создания заказа). Фолбэк — `cover.value.downloadLink` из живого продукта,
  // подгружаемого по id через RTK на уровне `OrdersList`.
  const coverFromEntity = (
    fullProduct?.attributeValues?.cover?.value as
      | { downloadLink?: string }
      | undefined
  )?.downloadLink;
  const previewSrc =
    product.previewImage?.previewLink ?? coverFromEntity ?? null;
  const href = '/shop/product/' + product.id;
  return (
    <div
      className={
        'flex items-center justify-between gap-3.75 ' + (first ? '' : 'mt-5')
      }
    >
      <Link href={href} aria-label={product.title} className="shrink-0">
        {previewSrc ? (
          <Image
            src={previewSrc}
            alt={product.title}
            width={69}
            height={69}
            className="h-17.25 w-17.25 object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="h-17.25 w-17.25 shrink-0 rounded bg-custom_gray_pk"
          />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <Link
          href={href}
          className="text-sm font-normal text-white hover:text-brand"
        >
          {product.title}
        </Link>
        <div className="flex items-center gap-2.5">
          <p className="text-xl font-bold text-brand">
            {UsePrice({ amount: product.price })}
          </p>
        </div>
      </div>
      <div className="flex h-11.25 w-8.75 items-center justify-center rounded-[5px] border border-white text-base font-normal text-white">
        x{product.quantity}
      </div>
    </div>
  );
};

/**
 * Дашборд заказов — разбивает заказы пользователя на "Active orders" и
 * "Orders History", с промо-сайдбаром только на десктопе. Повторяет верстку
 * `static-html/pk_active_orders.html`.
 *
 * Загружает данные через storage-маркер `delivery_order`; gracefully обрабатывает
 * состояния авторизации / пустого ответа / ошибки.
 * @returns {JSX.Element} JSX списка заказов.
 */
const OrdersList = ({
  promoBanners = [],
}: {
  promoBanners?: BlogBanner[];
} = {}): JSX.Element => {
  const { isAuth, isLoading: authLoading } = useContext(AuthContext);
  const { setComponent, setOpen } = useContext(OpenDrawerContext);
  const [orders, setOrders] = useState<IOrderByMarkerEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isAuth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await getAllOrdersByMarker({
        marker: 'delivery_order',
        offset: 0,
        limit: 50,
      });
      if (cancelled) return;
      if (res.isError) {
        setError(res.error?.message ?? 'Failed to load orders');
      } else {
        setOrders(res.orders ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuth]);

  const { active, history } = useMemo(() => {
    const a: IOrderByMarkerEntity[] = [];
    const h: IOrderByMarkerEntity[] = [];
    orders.forEach((o) => (isHistoryOrder(o) ? h.push(o) : a.push(o)));
    return { active: a, history: h };
  }, [orders]);

  // Подгружаем актуальные сущности продуктов для всех позиций во всех заказах,
  // чтобы взять `cover.value.downloadLink` как фолбэк, когда snapshot заказа
  // вернул `previewImage: null`. RTK дедуплицирует с другими местами (cart).
  const productIds = useMemo(() => {
    const set = new Set<number>();
    orders.forEach((o) => o.products.forEach((p) => set.add(p.id)));
    return Array.from(set);
  }, [orders]);
  const { data: fetchedProducts } = useGetProductsByIdsQuery(
    { items: productIds },
    { skip: productIds.length === 0 },
  );
  const productsById = useMemo(() => {
    const map = new Map<number, IProductsEntity>();
    (fetchedProducts ?? []).forEach((p) => map.set(p.id, p));
    return map;
  }, [fetchedProducts]);

  useEffect(() => {
    if (active.length === 0 && history.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedIds((prev) => {
      if (prev.size > 0) return prev;
      const next = new Set<number>();
      if (active[0]) next.add(active[0].id);
      if (history[0]) next.add(history[0].id);
      return next;
    });
  }, [active, history]);

  const toggle = (id: number): void => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Левая колонка — содержит контент, зависящий от состояния (loading /
  // not-auth / error / empty / orders-list). Правая колонка (промо) рендерится
  // на md+ во ВСЕХ состояниях, чтобы 2-колоночный layout соответствовал корзине.
  let leftColumn: JSX.Element;
  if (authLoading || loading) {
    leftColumn = <div className="text-paper/80">Loading orders...</div>;
  } else if (!isAuth) {
    leftColumn = (
      <div className="rounded-xl bg-ink/60 p-6 text-center text-paper/90">
        Please{' '}
        <button
          type="button"
          onClick={() => {
            setComponent('AuthProviderSelect');
            setOpen(true);
          }}
          className="cursor-pointer text-brand underline underline-offset-2 hover:no-underline"
        >
          sign in
        </button>{' '}
        to view your orders.
      </div>
    );
  } else if (error) {
    leftColumn = (
      <div className="rounded-xl bg-ink/60 p-6 text-paper/90">
        Unable to load orders: {error}
      </div>
    );
  } else if (orders.length === 0) {
    leftColumn = (
      <div className="flex flex-col items-center gap-5 rounded-xl bg-ink/60 p-6 text-center text-paper/90">
        <p>You have no orders yet.</p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center rounded-[5px] bg-brand px-3.75 py-1.5 text-base text-ink hover_btn_transp"
        >
          Go to shopping
        </Link>
      </div>
    );
  } else {
    leftColumn = (
      <>
        <p className="mt-2.5 text-xl text-paper">Active orders</p>
        {active.length === 0 ? (
          <p className="mt-2.75 text-sm text-paper/70">
            You have no active orders.
          </p>
        ) : (
          active.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              expanded={expandedIds.has(o.id)}
              onToggle={() => toggle(o.id)}
              isHistory={false}
              productsById={productsById}
            />
          ))
        )}
        <p className="mt-5 text-xl text-paper">Orders History</p>
        {history.length === 0 ? (
          <p className="mt-2.75 text-sm text-paper/70">
            You have no past orders yet.
          </p>
        ) : (
          history.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              expanded={expandedIds.has(o.id)}
              onToggle={() => toggle(o.id)}
              isHistory
              productsById={productsById}
            />
          ))
        )}
      </>
    );
  }

  return (
    <section>
      <div className="flex flex-col gap-10 md:flex-row md:gap-15">
        {/* `min-w-0` + `shrink-0` фиксируют 50/50: без них flex-дети раскрытой
            позиции заказа могут раздуть левую колонку и забрать ширину у правой. */}
        <div className="min-w-0 md:w-1/2 md:shrink-0">{leftColumn}</div>
        <aside className="hidden md:flex md:w-1/2 md:shrink-0 md:flex-col md:gap-10">
          {promoBanners
            .filter((b) => b.mobileImage)
            .map((b) => (
              <Link
                key={b.id}
                href={b.pageUrl ? `/promo/${b.pageUrl}` : '#'}
                title={b.title}
                className="block overflow-hidden rounded-[10px] transition-transform duration-500 hover:scale-[1.02]"
              >
                <Image
                  src={b.mobileImage as string}
                  alt={b.title}
                  width={620}
                  height={240}
                  className="h-auto w-full"
                />
              </Link>
            ))}
        </aside>
      </div>
    </section>
  );
};

export default OrdersList;
