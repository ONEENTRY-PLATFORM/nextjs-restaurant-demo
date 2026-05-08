'use client';

import Image from 'next/image';
import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';
import type { IOrderProducts } from 'oneentry/dist/orders/ordersInterfaces';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { getApi, getLang, isError } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { formatDate } from '@/app/utils/formatDate';
import ArrowBackIcon from '@/components/icons/arrow-back';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import {
  clearOrderReviewTarget,
  useOrderReviewTarget,
} from '@/components/profile/orderReviewStore';
import StarRating from '@/components/reviews/StarRating';
import DrawerAnimations from '@/components/shared/animations/DrawerAnimations';
import ClosePopupButton from '@/components/shared/ClosePopupButton';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

const FORM_MARKER = 'review_form';
const FORM_STATUS = 'approved';
const FORM_MODULE_CONFIG_ID = 2;
const RATING_MARKER = 'review_rating';
const TEXT_MARKER = 'review_text';

interface ExistingReview {
  id: number;
  rating: number;
  text: string;
}

type ItemState = {
  rating: number;
  text: string;
  loading: boolean;
  /** Id уже отправленной записи FormsData — null = ещё ничего не сохранено. */
  existingId: number | null;
  /** True = строка в режиме редактирования (поля активны, видна кнопка Apply). */
  isEditing: boolean;
  error: string;
};

const initialItemState = (initial: ExistingReview | null): ItemState => ({
  rating: initial?.rating ?? 0,
  text: initial?.text ?? '',
  loading: false,
  existingId: initial?.id ?? null,
  // Если отзыв уже есть — стартуем в read-only; если нет — сразу редактируем.
  isEditing: initial === null,
  error: '',
});

/**
 * Тот же формат номера заказа, что в `OrdersList` — поле `orderId` или
 * фолбэк на числовой `id`.
 * @param   {{ id: number; orderId?: string }} o - Сущность заказа.
 * @returns {string}                              Отображаемый номер.
 */
const formatOrderNumber = (o: { id: number; orderId?: string }): string => {
  if (o.orderId) return o.orderId;
  return String(o.id);
};

/**
 * Извлекает plain-текст из значения OneEntry-поля типа `text`.
 * @param   {unknown} value - Сырое `formData[].value`.
 * @returns {string}        Plain-текст.
 */
const readPlainText = (value: unknown): string => {
  if (Array.isArray(value)) {
    const first = value[0] as { plainValue?: unknown } | undefined;
    return typeof first?.plainValue === 'string' ? first.plainValue : '';
  }
  return typeof value === 'string' ? value : '';
};

/**
 * Кастит значение OneEntry-поля типа `integer` в число.
 * @param   {unknown} value - Сырое `formData[].value`.
 * @returns {number}        Числовое значение или 0.
 */
const readNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

/**
 * Подгружает уже отправленный отзыв текущего пользователя на конкретный
 * продукт. Возвращает `null`, если такого ещё нет, или при любой ошибке
 * SDK (graceful-fallback по правилам MISMATCH-LOG §C).
 * @param   {number} productId - Id продукта (он же `entityIdentifier`).
 * @param   {string} userId    - `user.identifier` авторизованного пользователя.
 * @returns {Promise<ExistingReview|null>}
 */
const fetchUserReview = async (
  productId: number,
  userId: string
): Promise<ExistingReview | null> => {
  try {
    const data = await getApi().FormData.getFormsDataByMarker(
      FORM_MARKER,
      FORM_MODULE_CONFIG_ID,
      {
        entityIdentifier: productId,
        userIdentifier: userId,
        status: ['approved'],
        dateFrom: '',
        dateTo: '',
      },
      1,
      getLang(),
      0,
      10
    );
    if (isError(data)) return null;
    const items = (
      data as unknown as {
        items?: Array<{
          id: number;
          parentId: number | null;
          userIdentifier?: string;
          formData?: Array<{ marker: string; value: unknown }>;
        }>;
      }
    ).items;
    if (!items || items.length === 0) return null;
    // На случай, если фильтр userIdentifier не сработал на сервере —
    // дополнительно сверяем клиентом + берём свежую запись (max id).
    const mine = items
      .filter(i => i.parentId === null && i.userIdentifier === userId)
      .sort((a, b) => b.id - a.id)[0];
    if (!mine) return null;
    const ratingField = mine.formData?.find(f => f.marker === RATING_MARKER);
    const textField = mine.formData?.find(f => f.marker === TEXT_MARKER);
    return {
      id: mine.id,
      rating: readNumber(ratingField?.value),
      text: readPlainText(textField?.value),
    };
  } catch {
    return null;
  }
};

/**
 * Одна строка попапа — продукт заказа: название сверху, ниже строка
 * `image | (stars + input + Apply/Edit)`. Apply создаёт новый отзыв
 * (`postFormsData`) или обновляет уже существующий (`updateFormsDataByid`)
 * — Edit переводит строку в режим редактирования. На вход подаётся
 * `initialReview`: если уже есть запись текущего пользователя для этого
 * продукта — стартуем с прочитанными значениями и в read-only.
 * @param   {object}                props                - Пропсы строки.
 * @param   {IOrderProducts}        props.product        - Позиция заказа.
 * @param   {IProductsEntity?}      props.fullProduct    - Актуальная сущность продукта (для cover-фолбэка).
 * @param   {ExistingReview | null} props.initialReview  - Уже отправленный отзыв пользователя или null.
 * @returns {JSX.Element}                                JSX строки.
 */
const ReviewableItem = ({
  product,
  fullProduct,
  initialReview,
}: {
  product: IOrderProducts;
  fullProduct: IProductsEntity | undefined;
  initialReview: ExistingReview | null;
}): JSX.Element => {
  const t = useT();
  const [state, setState] = useState<ItemState>(() => initialItemState(initialReview));

  const coverFromEntity = (
    fullProduct?.attributeValues?.cover?.value as { downloadLink?: string } | undefined
  )?.downloadLink;
  const previewSrc = product.previewImage?.previewLink ?? coverFromEntity ?? null;

  const onApply = async () => {
    if (state.loading) return;
    if (!state.rating) {
      setState(s => ({ ...s, error: 'Please select a rating.' }));
      return;
    }
    if (!state.text.trim()) {
      setState(s => ({ ...s, error: 'Please write a review.' }));
      return;
    }
    setState(s => ({ ...s, loading: true, error: '' }));
    const formData: FormDataType[] = [
      { marker: RATING_MARKER, type: 'integer', value: state.rating },
      {
        marker: TEXT_MARKER,
        type: 'text',
        value: [{ plainValue: state.text.trim() }],
      },
    ];
    try {
      if (state.existingId !== null) {
        // Редактирование уже отправленной записи. Эндпоинт PUT
        // `/api/content/form-data/{id}` (см. `FormData.updateFormsDataByid`)
        // требует авторизованного пользователя. Шлём тот же body, что
        // и `postFormsData`, без id (id в URL).
        const res = await getApi().FormData.updateFormsDataByid(state.existingId, {
          formIdentifier: FORM_MARKER,
          formModuleConfigId: FORM_MODULE_CONFIG_ID,
          moduleEntityIdentifier: String(product.id),
          replayTo: null,
          status: FORM_STATUS,
          formData,
        });
        if (isError(res)) {
          setState(s => ({
            ...s,
            loading: false,
            error: (res as { message?: string }).message || 'Failed to update review',
          }));
          return;
        }
        setState(s => ({ ...s, loading: false, isEditing: false }));
        return;
      }
      const res = await getApi().FormData.postFormsData({
        formIdentifier: FORM_MARKER,
        formData,
        formModuleConfigId: FORM_MODULE_CONFIG_ID,
        moduleEntityIdentifier: String(product.id),
        replayTo: null,
        status: FORM_STATUS,
      });
      if (isError(res)) {
        setState(s => ({
          ...s,
          loading: false,
          error: (res as { message?: string }).message || 'Failed to submit review',
        }));
        return;
      }
      const newId = (res as { formData?: { id?: number } }).formData?.id ?? null;
      setState(s => ({
        ...s,
        loading: false,
        isEditing: false,
        existingId: typeof newId === 'number' ? newId : s.existingId,
      }));
    } catch (err) {
      setState(s => ({
        ...s,
        loading: false,
        error: (err as Error).message || 'Failed to save review',
      }));
    }
  };

  const onEdit = () => {
    setState(s => ({ ...s, isEditing: true, error: '' }));
  };

  const isLocked = !state.isEditing || state.loading;

  return (
    <div className="flex flex-col gap-3.75">
      <p className="text-sm font-normal leading-4.25 text-paper">{product.title}</p>
      <div className="flex gap-3.75">
        {previewSrc ? (
          <Image
            src={previewSrc}
            alt={product.title}
            width={69}
            height={69}
            className="h-17.25 w-17.25 shrink-0 rounded-[5px] object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="h-17.25 w-17.25 shrink-0 rounded-[5px] bg-custom_gray_pk"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-3.75">
          <StarRating
            value={state.rating}
            size={16}
            {...(isLocked ? {} : { onChange: (v: number) => setState(s => ({ ...s, rating: v })) })}
          />
          <input
            type="text"
            value={state.text}
            onChange={e => setState(s => ({ ...s, text: e.target.value }))}
            disabled={isLocked}
            placeholder={t('review_placeholder', 'Review')}
            className="h-7.5 w-full rounded-[5px] border border-brand bg-transparent px-3.5 text-sm text-paper placeholder:text-paper/50 focus:outline-none disabled:opacity-70"
          />
          <div className="flex gap-5">
            <button
              type="button"
              onClick={onApply}
              disabled={isLocked}
              className="hover_btn_transp flex h-7.5 w-20 items-center justify-center rounded-[5px] border border-brand text-base text-brand disabled:opacity-60"
            >
              {state.loading ? '…' : t('apply_text', 'Apply')}
            </button>
            <button
              type="button"
              onClick={onEdit}
              disabled={state.existingId === null || state.isEditing || state.loading}
              className="hover_btn_white flex h-7.5 w-20 items-center justify-center rounded-[5px] border border-paper text-base text-paper disabled:opacity-50"
            >
              {t('edit_button', 'Edit')}
            </button>
          </div>
          {state.existingId !== null && !state.isEditing && (
            <p className="text-sm text-brand">
              {t('review_submitted_text', 'Thanks for your review!')}
            </p>
          )}
          {state.error && <p className="text-sm text-red-400">{state.error}</p>}
        </div>
      </div>
    </div>
  );
};

/**
 * Попап «Leave a review» — открывается из `OrdersList` для заказа
 * целиком (одна кнопка на заказ, не на каждый товар). Внутри показывает
 * сводку заказа и список позиций; для каждой позиции — звёзды +
 * инпут отзыва + Apply/Edit. Повторяет фигму node 2383:7883.
 *
 * Открывается через `OpenDrawerContext` (component === 'OrderReviewPopup').
 * Полная сущность заказа + map продуктов передаётся через модульный
 * `orderReviewStore` (см. {@link useOrderReviewTarget}), потому что
 * контекст drawer-а пробрасывает в попап только строковый `action`.
 *
 * При открытии параллельно подгружаем уже отправленные отзывы текущего
 * пользователя на каждый продукт заказа — если есть, строка стартует в
 * read-only с прочитанными rating/text, Edit ↔ Apply переключают режим
 * и Apply вызывает `updateFormsDataByid` вместо `postFormsData`.
 * @returns {JSX.Element} JSX попапа.
 */
const OrderReviewPopup = (): JSX.Element => {
  const t = useT();
  const { open, component, setOpen, setTransition } = useContext(OpenDrawerContext);
  const { isAuth, user } = useContext(AuthContext);
  const { order, productsById } = useOrderReviewTarget();
  const isOpen = open && component === 'OrderReviewPopup';
  const sheetRef = useRef<HTMLDivElement | null>(null);

  // Map productId → существующий отзыв пользователя (или null если не
  // загружен либо отсутствует). `undefined` ключ = ещё грузится.
  const [existingReviews, setExistingReviews] = useState<Map<number, ExistingReview | null>>(
    new Map()
  );
  const [prefilling, setPrefilling] = useState(false);

  useSwipeToClose(sheetRef, () => setOpen(false));

  // Чистим target после закрытия и сбрасываем prefilled-кэш.
  useEffect(() => {
    if (!isOpen) {
      clearOrderReviewTarget();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExistingReviews(new Map());
    }
  }, [isOpen]);

  const orderId = order?.id ?? null;
  const userId = user?.identifier ?? '';

  // Параллельно подгружаем уже отправленные отзывы юзера на каждый продукт
  // заказа. Запускается один раз на (открытие × order × user). Map ключуем
  // по productId — первый продукт каждого id выигрывает (если в заказе
  // одинаковые позиции, отзыв ставится один раз на продукт).
  const productIds = useMemo(() => {
    if (!order) return [] as number[];
    const seen = new Set<number>();
    const ids: number[] = [];
    for (const p of order.products) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        ids.push(p.id);
      }
    }
    return ids;
  }, [order]);

  useEffect(() => {
    if (!isOpen || !orderId || !userId || productIds.length === 0) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefilling(true);
    (async () => {
      const entries = await Promise.all(
        productIds.map(async pid => [pid, await fetchUserReview(pid, userId)] as const)
      );
      if (cancelled) return;
      setExistingReviews(new Map(entries));
      setPrefilling(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, orderId, userId, productIds]);

  if (!order) return <></>;

  const close = (): void => setTransition('close');
  const created = (order as unknown as { createdDate?: string }).createdDate;
  const statusLabel =
    (order.statusLocalizeInfos as { title?: string } | undefined)?.title ??
    order.statusIdentifier ??
    '';

  return (
    <DrawerAnimations component="OrderReviewPopup">
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-20 flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-t-[20px] bg-ink/80 px-5 pt-5 pb-10 backdrop-blur-[10px] shadow-xl md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:h-auto md:max-w-182 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px] md:p-10"
      >
        <div className="flex items-center justify-between gap-5">
          <button
            type="button"
            onClick={close}
            aria-label="Back"
            className="group flex items-center justify-center"
          >
            <ArrowBackIcon className="hover-target text-paper" />
          </button>
          <p className="font-bold text-[24px] leading-7.5 text-brand">
            {t('leave_review', 'Leave a review')}
          </p>
          <ClosePopupButton onClose={close} ariaLabel="Close review form" />
        </div>

        {!isAuth ? (
          <div className="mt-7.5 rounded-xl bg-ink/60 p-6 text-center text-paper/90">
            {t('please_signin_review_text', 'Please sign in to leave a review.')}
          </div>
        ) : (
          <>
            <p className="mt-7.5 text-center font-normal text-xl text-paper">
              {t('please_leave_review_text', 'Please, leave a review!')}
            </p>

            <div className="mt-3.75 flex w-full items-center justify-between gap-2 rounded-[5px] bg-custom_gray_pk px-3.75 py-1.5 text-sm text-white lg:text-base">
              <p className="font-bold">№{formatOrderNumber(order)}</p>
              <p className="capitalize">{statusLabel}</p>
              <p>{formatDate(created)}</p>
            </div>

            {prefilling ? (
              <div className="mt-3.75 text-paper/70">{t('loading_orders_text', 'Loading...')}</div>
            ) : (
              <div className="mt-3.75 flex flex-col gap-3.75">
                {order.products.map((p, idx) => (
                  <ReviewableItem
                    key={`${p.id}-${idx}`}
                    product={p}
                    fullProduct={productsById.get(p.id)}
                    initialReview={existingReviews.get(p.id) ?? null}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <ModalBackdrop />
    </DrawerAnimations>
  );
};

export default OrderReviewPopup;
