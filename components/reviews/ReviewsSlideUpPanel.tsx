'use client';

import type { JSX } from 'react';
import { useContext, useState } from 'react';

import { submitReview } from '@/app/actions/review';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

import StarRating from './StarRating';

/**
 * ReviewsSlideUpPanel — fixed slide-up review panel (mobile sheet).
 * Submits the review via the {@link submitReview} Server Action.
 * @param   {object} props               - Props.
 * @param   {number} props.productId     - Product ID the review is attached to.
 * @param   {string} [props.title]       - Override for the panel heading.
 * @param   {string} [props.description] - Override for the panel description.
 * @returns {JSX.Element}                Panel JSX.
 */
const ReviewsSlideUpPanel = ({
  productId,
  title = 'Reviews',
  description = 'Please leave a review about your visit',
}: {
  productId: number;
  title?: string;
  description?: string;
}): JSX.Element => {
  const { isAuth } = useContext(AuthContext);
  const { open, setOpen, setComponent } = useContext(OpenDrawerContext);

  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const onApply = async () => {
    if (!isAuth) {
      setComponent('AuthProviderSelect');
      setOpen(!open);
      return;
    }
    if (!text.trim()) {
      setError('Please write a review.');
      return;
    }
    setLoading(true);
    setError('');
    const res = await submitReview({
      rating: rating || 5,
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

  return (
    <div className="review_sheet">
      <div className="mx-auto max-w-88.75">
        <div className="flex items-center justify-center gap-1.25">
          <p className="text-center font-bold text-[20px] text-brand">{title}</p>
        </div>
        <p className="mt-5 font-normal text-[16px] text-paper">
          {isAuth ? description : 'Sign in to leave a review.'}
        </p>

        <div className="mt-4 flex justify-center">
          <StarRating value={rating} onChange={setRating} size={24} />
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.currentTarget.value)}
          disabled={!isAuth}
          className="mt-5 w-full resize-none rounded-[5px] border border-brand bg-transparent p-2 text-paper disabled:opacity-60"
          rows={4}
        />

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={onApply}
            disabled={loading || success}
            className="flex h-8.75 w-23.75 items-center justify-center rounded-[5px] border border-brand text-brand hover_btn_white disabled:opacity-60"
          >
            {!isAuth ? 'Sign in' : success ? 'Sent' : loading ? '...' : 'Apply'}
          </button>
          <button
            type="button"
            onClick={() => {
              setText('');
              setRating(0);
              setSuccess(false);
              setError('');
            }}
            className="flex h-8.75 w-23.75 items-center justify-center rounded-[5px] border border-paper text-paper hover_btn_white"
          >
            Edit
          </button>
        </div>

        {error ? <p className="mt-2 text-center text-sm text-red-400">{error}</p> : null}
      </div>
      <div className="h-25 border-none bg-transparent"></div>
    </div>
  );
};

export default ReviewsSlideUpPanel;
