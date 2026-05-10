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
  /** Id of the already submitted FormsData record - null = nothing saved yet. */
  existingId: number | null;
  /** True = row is in edit mode. */
  isEditing: boolean;
  error: string;
};

/**
 * initialItemState — derives the per-row local state from an optional existing review.
 *
 * @param   {ExistingReview | null} initial - Existing review for the product, or `null` when none was found.
 * @returns Initial `ItemState` for the row (read-only when an existing review is provided).
 */
const initialItemState = (initial: ExistingReview | null): ItemState => ({
  rating: initial?.rating ?? 0,
  text: initial?.text ?? '',
  loading: false,
  existingId: initial?.id ?? null,
  // Already submitted review - start in read-only.
  isEditing: initial === null,
  error: '',
});

/**
 * formatOrderNumber — order number `OE…` from the SDK, otherwise fallback to the numeric id.
 *
 * @param   {{ id: number; orderId?: string }} o - Order entity with `id` and optional `orderId` string.
 * @returns Display order number.
 */
const formatOrderNumber = (o: { id: number; orderId?: string }): string => {
  if (o.orderId) return o.orderId;
  return String(o.id);
};

/**
 * readPlainText — extracts plain text from an OneEntry field value of type `text`.
 *
 * @param   {unknown} value - Raw `formData[].value`.
 * @returns Plain text string (empty on unexpected shape).
 */
const readPlainText = (value: unknown): string => {
  if (Array.isArray(value)) {
    const first = value[0] as { plainValue?: unknown } | undefined;
    return typeof first?.plainValue === 'string' ? first.plainValue : '';
  }
  return typeof value === 'string' ? value : '';
};

/**
 * readNumber — casts an OneEntry field value of type `integer` to a number (0 on error).
 *
 * @param   {unknown} value - Raw `formData[].value`.
 * @returns Numeric rating (`0` for non-numeric values).
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
 * fetchUserReview — loads the user's already submitted review for a product.
 *
 * @param   {number} productId - OneEntry product id (used as `entityIdentifier`).
 * @param   {string} userId    - OneEntry user identifier.
 * @returns Promise resolving to the existing review, or `null` when none / on SDK error (graceful fallback).
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
    // Extra client-side filter (in case the server userIdentifier did not apply) + take the latest record (max id).
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
 * ReviewableItem — popup row: product + stars + input + Apply/Edit.
 *
 * Apply creates `postFormsData` or updates via `updateFormsDataByid`. When `initialReview` is provided,
 * the row starts in read-only mode and switches to edit on demand.
 *
 * @param   {object}                     props               - Component props.
 * @param   {IOrderProducts}             props.product       - Order line-item entity.
 * @param   {IProductsEntity | undefined} props.fullProduct  - Full product entity used to resolve a fallback cover image.
 * @param   {ExistingReview | null}      props.initialReview - Existing review to prefill (or `null` when none).
 * @returns JSX of the reviewable row.
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
        // Edit: PUT `/api/content/form-data/{id}` - same body as in `postFormsData`, id in the URL. Requires auth.
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
            className="h-17.25 w-17.25 shrink-0 rounded-card object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="h-17.25 w-17.25 shrink-0 rounded-card bg-custom_gray_pk"
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
            className="h-7.5 w-full rounded-card border border-brand bg-transparent px-3.5 text-sm text-paper placeholder:text-paper/50 focus:outline-none disabled:opacity-70"
          />
          <div className="flex gap-5">
            <button
              type="button"
              onClick={onApply}
              disabled={isLocked}
              className="hover_btn_transp flex h-7.5 w-20 items-center justify-center rounded-card border border-brand text-base text-brand disabled:opacity-60"
            >
              {state.loading ? '' : t('apply_text', 'Apply')}
            </button>
            <button
              type="button"
              onClick={onEdit}
              disabled={state.existingId === null || state.isEditing || state.loading}
              className="hover_btn_white flex h-7.5 w-20 items-center justify-center rounded-card border border-paper text-base text-paper disabled:opacity-50"
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
 * OrderReviewPopup — "Leave a review" popup for the entire order (one button per order).
 *
 * Order summary + line-item list; each row has stars + input + Apply/Edit.
 * The order entity is passed via `orderReviewStore` because `OpenDrawerContext` only forwards a string `action`.
 *
 * @returns JSX of the order-review popup, or empty fragment when no order is targeted.
 */
const OrderReviewPopup = (): JSX.Element => {
  const t = useT();
  const { open, component, setOpen, setTransition } = useContext(OpenDrawerContext);
  const { isAuth, user } = useContext(AuthContext);
  const { order, productsById } = useOrderReviewTarget();
  const isOpen = open && component === 'OrderReviewPopup';
  const sheetRef = useRef<HTMLDivElement | null>(null);

  // Map productId -> existing review (null = none, missing key = still loading).
  const [existingReviews, setExistingReviews] = useState<Map<number, ExistingReview | null>>(
    new Map()
  );
  const [prefilling, setPrefilling] = useState(false);

  useSwipeToClose(sheetRef, () => setOpen(false));

  useEffect(() => {
    if (!isOpen) {
      clearOrderReviewTarget();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExistingReviews(new Map());
    }
  }, [isOpen]);

  const orderId = order?.id ?? null;
  const userId = user?.identifier ?? '';

  // Unique productIds - a review is left once per product, even if the line item repeats in the order.
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
        className="fixed bottom-0 left-0 right-0 z-20 flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-t-[20px] bg-ink/80 px-5 pt-5 pb-10 backdrop-blur-card shadow-xl md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:h-auto md:max-w-182 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px] md:p-10"
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
          <p className="font-bold text-2xl leading-7.5 text-brand">
            {t('leave_review', 'Leave a review')}
          </p>
          {/* Close lives in the bottom-menu on mobile (CenterCloseButton); show only md+. */}
          <ClosePopupButton
            onClose={close}
            ariaLabel="Close review form"
            className="max-md:hidden"
          />
          <span aria-hidden="true" className="size-11.5 md:hidden" />
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

            <div className="mt-3.75 flex w-full items-center justify-between gap-2 rounded-card bg-custom_gray_pk px-3.75 py-1.5 text-sm text-white lg:text-base">
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
