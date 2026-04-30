'use client';

import type { FormEvent, JSX } from 'react';
import { useContext, useState } from 'react';

import { submitReview } from '@/app/actions/review';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

import ErrorMessage from '../forms/inputs/ErrorMessage';
import StarRating from './StarRating';

/**
 * Резолвит отображаемое имя для залогиненного пользователя — fallback по
 * цепочке `name_reg` → `email_reg` → SDK identifier, чтобы строка "Posting as …"
 * никогда не оказывалась пустой.
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
 * Форма отзыва на продукт — звёздный рейтинг + текст, отправляется через
 * {@link submitReview} Server Action в форму `review_form` в OneEntry. Форма
 * заблокирована sign-in CTA, когда посетитель не авторизован; идентификация
 * автора берётся из {@link AuthContext} только для подписи "Posting as …" —
 * автор и связь с продуктом резолвятся на сервере через SDK auth-сессию и
 * `moduleEntityIdentifier=productId` соответственно.
 * @param   {object}      props           - Пропсы компонента.
 * @param   {number}      props.productId - Product ID, к которому привязан отзыв.
 * @returns {JSX.Element}                 JSX формы отзыва.
 */
const ReviewForm = ({ productId }: { productId: number }): JSX.Element => {
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
        <h3 className="font-bold text-[18px] uppercase text-brand">
          Leave a review
        </h3>
        <p className="text-sm text-paper/80">
          Please sign in to leave a review.
        </p>
        <button
          type="button"
          onClick={() => {
            setComponent('SignInForm');
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
    const res = await submitReview({
      rating,
      text: text.trim(),
      productId,
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setRating(0);
      setText('');
    } else {
      setError(res.message);
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
      <h3 className="font-bold text-[18px] uppercase text-brand">
        Leave a review
      </h3>
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
