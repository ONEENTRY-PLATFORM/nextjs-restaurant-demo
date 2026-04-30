'use client';

import Image from 'next/image';
import type { JSX } from 'react';
import { useState } from 'react';

import type { ProductReview } from '@/app/api';
import ChatDotsIcon from '@/components/icons/chat-dots.svg';
import StarCardIcon from '@/components/icons/star-card';

/**
 * Список отзывов на карточке товара — порт блока `<!-- rewiews -->` из
 * `static-html/details.html`. Данные ожидаются в нормализованной форме
 * `ProductReview[]` (см. `getProductReviews`); рендер скрыт, если пусто.
 * @param   {object}            props         - Пропсы компонента.
 * @param   {ProductReview[]}   props.reviews - Отзывы верхнего уровня.
 * @returns {JSX.Element|null}                JSX карусели или `null`, если пусто.
 */
const ProductReviewsList = ({
  reviews,
}: {
  reviews: ProductReview[];
}): JSX.Element | null => {
  const [index, setIndex] = useState(0);

  if (reviews.length === 0) return null;

  const goPrev = () =>
    setIndex((i) => (i - 1 + reviews.length) % reviews.length);
  const goNext = () => setIndex((i) => (i + 1) % reviews.length);

  return (
    <div className="mt-4.5 w-full">
      <div className="group_white flex items-center justify-start gap-1.25 font-normal text-[17px] text-brand">
        Reviews
        <ChatDotsIcon className="hover-target" />
      </div>

      <div className="relative flex items-stretch gap-3.75 mt-2.5 md:px-8">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous review"
          className="hidden md:flex shrink-0 items-center absolute left-0 top-1/2 -translate-y-1/2 z-10"
        >
          <Image
            src="/images/icons/chevron-pager-left.svg"
            alt=""
            width={16}
            height={27}
          />
        </button>

        <div className="relative w-full min-w-0 overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {reviews.map((review, i) => (
              <div
                key={review.id}
                className="w-full shrink-0 grow-0 basis-full flex flex-col gap-2.5"
                aria-hidden={i !== index}
              >
                <div className="mt-7 flex justify-between">
                  <div className="flex items-center gap-1.25">
                    <div className="flex items-center gap-0.75">
                      <StarCardIcon size={11} filled={review.rating >= 1} />
                      <StarCardIcon size={11} filled={review.rating >= 2} />
                      <StarCardIcon size={11} filled={review.rating >= 3} />
                      <StarCardIcon size={11} filled={review.rating >= 4} />
                      <StarCardIcon size={11} filled={review.rating >= 5} />
                    </div>
                    <p className="font-normal text-[14px] text-paper">
                      {review.author}
                    </p>
                  </div>
                  <p className="font-normal text-[12px] text-paper">
                    {review.date}
                  </p>
                </div>
                <p className="mt-2.5 font-normal text-[14px] text-paper">
                  {review.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label="Next review"
          className="hidden md:flex shrink-0 items-center absolute right-0 top-1/2 -translate-y-1/2 z-10"
        >
          <Image
            src="/images/icons/chevron-pager-right.svg"
            alt=""
            width={16}
            height={27}
          />
        </button>
      </div>
    </div>
  );
};

export default ProductReviewsList;
