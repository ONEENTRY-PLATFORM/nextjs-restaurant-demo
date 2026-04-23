'use client';

import type { FormEvent, JSX } from 'react';
import { useState } from 'react';

import { submitReview } from '@/app/actions/review';

import ErrorMessage from '../forms/inputs/ErrorMessage';
import StarRating from './StarRating';

/**
 * Product review form — star rating + text + author, submits via
 * {@link submitReview} Server Action to the `review` form in OneEntry.
 * @param   {object}      props           - Component props.
 * @param   {number}      props.productId - Product ID the review is attached to.
 * @returns {JSX.Element}                 Review form JSX.
 */
const ReviewForm = ({ productId }: { productId: number }): JSX.Element => {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      author: author.trim() || 'Anonymous',
      productId,
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      setRating(0);
      setText('');
      setAuthor('');
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
      <div className="flex items-center gap-3">
        <span className="text-sm text-paper/80">Rating:</span>
        <StarRating value={rating} onChange={setRating} size={24} />
      </div>
      <input
        type="text"
        value={author}
        onChange={(e) => setAuthor(e.currentTarget.value)}
        placeholder="Your name"
        className="w-full bg-transparent border-b border-muted text-paper text-lg py-2 focus:outline-none focus:border-brand"
      />
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
