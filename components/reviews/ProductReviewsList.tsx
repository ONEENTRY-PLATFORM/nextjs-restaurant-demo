'use client';

import Image from 'next/image';
import type { JSX } from 'react';
import { useRef, useState } from 'react';

import type { ProductReview } from '@/app/api';
import ChatDotsIcon from '@/components/icons/chat-dots.svg';
import StarCardIcon from '@/components/icons/star-card';

const SWIPE_THRESHOLD_PX = 40;

/**
 * Список отзывов на карточке товара — порт блока `<!-- rewiews -->` из
 * `static-html/details.html`. Заголовок блока рендерится всегда, даже если отзывов нет.
 * @param   {object}          props           - Пропсы компонента.
 * @param   {ProductReview[]} props.reviews   - Отзывы верхнего уровня.
 * @param   {number}          props.productId - ID продукта (для триггера попапа).
 * @returns {JSX.Element}                     JSX блока отзывов.
 */
const ProductReviewsList = ({ reviews }: { reviews: ProductReview[] }): JSX.Element => {
  const [index, setIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  const goPrev = () => setIndex(i => (i - 1 + reviews.length) % reviews.length);
  const goNext = () => setIndex(i => (i + 1) % reviews.length);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    touchStartXRef.current = null;
    if (startX === null || reviews.length < 2) return;
    const endX = e.changedTouches[0]?.clientX;
    if (endX === undefined) return;
    const delta = endX - startX;
    if (delta <= -SWIPE_THRESHOLD_PX) goNext();
    else if (delta >= SWIPE_THRESHOLD_PX) goPrev();
  };

  return (
    <div className="mt-4.5 w-full">
      <div className="flex items-center justify-between gap-2.5">
        <div className="group_white flex items-center justify-start gap-1.25 font-normal text-[17px] text-brand">
          Reviews
          <ChatDotsIcon className="hover-target" />
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="mt-5 font-normal text-[14px] text-paper/70">
          No reviews yet — be the first to share your experience.
        </p>
      ) : (
        <div className="relative flex items-stretch gap-3.75 mt-2.5 px-8 overflow-hidden">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous review"
            className="flex shrink-0 items-center absolute left-0 top-1/2 -translate-y-1/2 z-10"
          >
            <Image src="/images/icons/chevron-pager-left.svg" alt="" width={16} height={27} />
          </button>

          <div
            className="relative w-full min-w-0 overflow-hidden touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {reviews.map((review, i) => (
                <div
                  key={review.id}
                  className="w-full shrink-0 grow-0 basis-full flex flex-col gap-2.5 overflow-hidden"
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
                      <p className="font-normal text-[14px] text-paper">{review.author}</p>
                    </div>
                    <p className="font-normal text-[12px] text-paper">{review.date}</p>
                  </div>
                  <p className="mt-2.5 font-normal text-[14px] text-paper">{review.text}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={goNext}
            aria-label="Next review"
            className="flex shrink-0 items-center absolute right-0 top-1/2 -translate-y-1/2 z-10"
          >
            <Image src="/images/icons/chevron-pager-right.svg" alt="" width={16} height={27} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductReviewsList;
