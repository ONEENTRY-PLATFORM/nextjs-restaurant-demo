'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { JSX } from 'react';
import { useLayoutEffect, useRef, useTransition } from 'react';
import { useCallback } from 'react';

import { useT } from '@/app/store/providers/DictProvider';

import CardAnimations from '../animations/CardAnimations';
import { SkeletonBody } from './ProductsGridLoader';

/**
 * LoadMore — auto-loads the next page via ScrollTrigger (also clickable as a manual trigger).
 *
 * @param   {object} props               - Component props.
 * @param   {number} props.totalPages    - Total number of pages; the component stops loading when reached.
 * @param   {number} props.productsLimit - Page size, used to render the placeholder skeleton row.
 * @param   {number} props.total         - Total item count, used to cap the skeleton row on the last (partial) page.
 * @returns JSX of the skeleton-row/trigger button that drives the next-page navigation.
 */
const LoadMore = ({
  totalPages,
  productsLimit,
  total,
}: {
  totalPages: number;
  productsLimit: number;
  total: number;
}): JSX.Element => {
  const t = useT();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const currentPage = Number(searchParams.get('page')) || 1;
  const nextPage = (currentPage < 1 ? 1 : currentPage) + 1;

  const ref = useRef(null);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams]
  );

  useLayoutEffect(() => {
    gsap.registerPlugin(useGSAP, ScrollTrigger);
  }, []);

  const goToNextPage = () => {
    startTransition(() => {
      router.push(
        pathname +
          '?' +
          createQueryString('page', (nextPage <= totalPages ? nextPage : currentPage).toString()),
        { scroll: false }
      );
    });
  };

  useGSAP(() => {
    if (nextPage > totalPages) {
      return;
    }
    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top bottom',
      end: 'bottom bottom',
      onEnter: () => {
        goToNextPage();
      },
    });

    return () => {
      trigger.kill();
    };
  }, [currentPage, searchParams]);

  if (isPending) {
    const remaining = Math.max(0, Math.min(productsLimit, total - currentPage * productsLimit));
    const baseIndex = (currentPage - 1) * productsLimit;
    return (
      <div aria-hidden="true" className="menu_items w-full">
        {Array.from({ length: remaining }).map((_, i) => (
          <CardAnimations
            key={i}
            className="menu_item relative flex flex-col"
            index={baseIndex + i}
            productsLimit={productsLimit}
          >
            <SkeletonBody />
          </CardAnimations>
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={goToNextPage}
      ref={ref}
      aria-label={t('load_more_label', 'Load more')}
      className="relative mx-auto flex h-6 w-20"
    />
  );
};

export default LoadMore;
