'use client';

import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';
import type { FormEvent, JSX } from 'react';
import { useContext, useState } from 'react';

import { getApi, isError } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

import ErrorMessage from '../forms/inputs/ErrorMessage';
import StarRating from './StarRating';

const FORM_MARKER = 'review_form';
const FORM_STATUS = 'approved';
// `moduleFormConfigs[0].id` формы `review_form` в OneEntry-админке = 2
// (проверено через SDK Forms.getFormByMarker; раньше тут хардкодом
// стоял 5 — отсюда сабмит молча валился с серверной стороны). Форма
// привязана к module `catalog`, entityIdentifier `menu` (nested = true)
// — т.е. отзыв хранится по id продукта, лежащего под страницей `menu`.
const FORM_MODULE_CONFIG_ID = 2;
const RATING_MARKER = 'review_rating';
const TEXT_MARKER = 'review_text';

/**
 * Резолвит отображаемое имя для залогиненного пользователя.
 * @param   {{ identifier?: string; formData?: unknown }} user - Сущность залогиненного пользователя.
 * @returns {string}                                            Отображаемое имя.
 */
const resolveAuthorName = (user: {
  identifier?: string;
  formData?: unknown;
}): string => {
  const formData = Array.isArray(user.formData)
    ? (user.formData as Array<{ marker?: unknown; value?: unknown }>)
    : [];
  const byMarker = (marker: string) => {
    const field = formData.find((f) => f && f.marker === marker);
    return typeof field?.value === 'string' ? field.value.trim() : '';
  };
  return byMarker('name_reg') || byMarker('email_reg') || user.identifier || '';
};

/**
 * Форма отзыва на продукт — звёздный рейтинг + текст.
 * @param   {object}      props           - Пропсы компонента.
 * @param   {number}      props.productId - Product ID, к которому привязан отзыв.
 * @param   {boolean}     [props.hideTitle] - Не рендерить заголовок (`Leave a review`),
 *                                            если он уже есть в шапке родителя (попап).
 * @returns {JSX.Element}                 JSX формы отзыва.
 */
const ReviewForm = ({
  productId,
  hideTitle = false,
}: {
  productId: number;
  hideTitle?: boolean;
}): JSX.Element => {
  const t = useT();
  const leaveReviewLabel = t('leave_review', 'Leave a review');
  const { isAuth, user } = useContext(AuthContext);
  const { open, setOpen, setComponent } = useContext(OpenDrawerContext);

  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isAuth || !user) {
    return (
      <div className="flex flex-col gap-3 rounded-xl bg-ink/60 p-5 text-paper">
        {hideTitle ? null : (
          <h3 className="font-bold text-[18px] uppercase text-brand">
            {leaveReviewLabel}
          </h3>
        )}
        <p className="text-sm text-paper/80">
          Please sign in to leave a review.
        </p>
        <button
          type="button"
          onClick={() => {
            setComponent('AuthProviderSelect');
            setOpen(!open);
          }}
          className="h-12.5 w-full rounded-[10px] bg-custom-gradient font-bold text-[16px] uppercase text-white hover:bg-gradient-to-r-hover"
        >
          Sign in
        </button>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rating) {
      setError('Please select a rating.');
      return;
    }
    if (!text.trim()) {
      setError('Please write a review.');
      return;
    }
    setLoading(true);
    setError('');
    // Зовём SDK напрямую с клиента, чтобы user-token из auth-сессии
    // подхватился. Серверный action этот контекст не несёт — отсюда
    // раньше был "You must authorize to send data".
    try {
      const formData: FormDataType[] = [
        {
          marker: RATING_MARKER,
          type: 'integer',
          value: rating,
        } as unknown as FormDataType,
        {
          marker: TEXT_MARKER,
          type: 'text',
          // OneEntry: «Only one of htmlValue, plainValue or mdValue can be provided».
          value: [{ plainValue: text.trim() }],
        } as unknown as FormDataType,
      ];
      const res = await getApi().FormData.postFormsData({
        formIdentifier: FORM_MARKER,
        formData,
        formModuleConfigId: FORM_MODULE_CONFIG_ID,
        moduleEntityIdentifier: String(productId),
        replayTo: null,
        status: FORM_STATUS,
      });
      setLoading(false);
      if (isError(res)) {
        setError(
          (res as { message?: string }).message || 'Failed to submit review',
        );
        return;
      }
      setSuccess(true);
      setRating(0);
      setText('');
    } catch (err) {
      setLoading(false);
      setError((err as Error).message || 'Failed to submit review');
    }
  };

  if (success) {
    return (
      <div className="rounded-xl bg-ink/60 p-5 text-paper">
        Thank you for your review!
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {hideTitle ? null : (
        <h3 className="font-bold text-[18px] uppercase text-brand">
          {leaveReviewLabel}
        </h3>
      )}
      <p className="text-sm text-paper/70">
        Posting as <span className="text-paper">{resolveAuthorName(user)}</span>
      </p>
      <div className="flex items-center gap-3">
        <span className="text-sm text-paper/80">Rating:</span>
        <StarRating value={rating} onChange={setRating} size={24} />
      </div>
      <textarea
        rows={4}
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        placeholder="Tell us what you think..."
        className="w-full bg-transparent border border-muted rounded-md text-paper text-base p-3 focus:outline-none focus:border-brand"
      />
      <button
        type="submit"
        disabled={loading}
        className="h-12.5 w-full rounded-[10px] bg-custom-gradient font-bold text-[16px] uppercase text-white hover:bg-gradient-to-r-hover disabled:opacity-60"
      >
        {loading ? '...' : 'Submit review'}
      </button>
      {error ? <ErrorMessage error={error} /> : null}
    </form>
  );
};

export default ReviewForm;
