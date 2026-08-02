'use client';

import Image from 'next/image';
import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';
import type { IOrderProducts } from 'oneentry/dist/orders/ordersInterfaces';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';
import { useState } from 'react';

import { getApi, getProductImageUrl, isError } from '@/app/api';
import { useT } from '@/app/store/providers/DictProvider';
import { normalizeErrorMessage } from '@/app/utils/errorHandler';
import {
  type ExistingReview,
  FORM_MARKER,
  FORM_STATUS,
  initialItemState,
  type ItemState,
  RATING_MARKER,
  TEXT_MARKER,
} from '@/components/profile/orderReviewUtils';
import StarRating from '@/components/reviews/StarRating';

/**
 * ReviewableItem — popup row: product + stars + input + Apply/Edit.
 *
 * @param   {object}                     props               - Component props.
 * @param   {IOrderProducts}             props.product       - Order line-item entity.
 * @param   {IProductsEntity | undefined} props.fullProduct   - Full product entity used to resolve a fallback image from `images`.
 * @param   {ExistingReview | null}      props.initialReview  - Existing review to prefill (or `null` when none).
 * @param   {number}                     props.moduleConfigId - `moduleFormConfigs[0].id` resolved from the form.
 * @returns JSX of the reviewable row.
 */
const ReviewableItem = ({
  product,
  fullProduct,
  initialReview,
  moduleConfigId,
}: {
  product: IOrderProducts;
  fullProduct: IProductsEntity | undefined;
  initialReview: ExistingReview | null;
  moduleConfigId: number;
}): JSX.Element => {
  const t = useT();
  const [state, setState] = useState<ItemState>(() => initialItemState(initialReview));

  const fallbackFromEntity = getProductImageUrl(fullProduct?.attributeValues);
  const previewSrc = product.previewImage?.previewLink ?? fallbackFromEntity ?? null;

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
        const res = await getApi().FormData.updateFormsDataByid(state.existingId, {
          formIdentifier: FORM_MARKER,
          formModuleConfigId: moduleConfigId,
          moduleEntityIdentifier: String(product.id),
          replayTo: null,
          status: FORM_STATUS,
          formData,
        });
        if (isError(res)) {
          setState(s => ({
            ...s,
            loading: false,
            error: normalizeErrorMessage(
              (res as { message?: string | string[] }).message,
              'Failed to update review'
            ),
          }));
          return;
        }
        setState(s => ({ ...s, loading: false, isEditing: false }));
        return;
      }
      const res = await getApi().FormData.postFormsData({
        formIdentifier: FORM_MARKER,
        formData,
        formModuleConfigId: moduleConfigId,
        moduleEntityIdentifier: String(product.id),
        replayTo: null,
        status: FORM_STATUS,
      });
      if (isError(res)) {
        setState(s => ({
          ...s,
          loading: false,
          error: normalizeErrorMessage(
            (res as { message?: string | string[] }).message,
            'Failed to submit review'
          ),
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
      <p className="text-sm leading-4.25 font-normal text-paper">{product.title}</p>
      <div className="flex gap-3.75">
        {previewSrc ? (
          <Image
            src={previewSrc}
            alt={product.title}
            width={69}
            height={69}
            className="size-17.25 shrink-0 rounded-card object-cover"
          />
        ) : (
          <div aria-hidden="true" className="size-17.25 shrink-0 rounded-card bg-custom_gray_pk" />
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
              className="hover_btn_paper flex h-7.5 w-20 items-center justify-center rounded-card border border-paper text-base text-paper disabled:opacity-50"
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

export default ReviewableItem;
