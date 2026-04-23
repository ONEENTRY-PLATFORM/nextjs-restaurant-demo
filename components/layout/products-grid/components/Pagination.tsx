'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useTransitionRouter } from 'next-transition-router';
import type { JSX } from 'react';
import { useCallback } from 'react';

/**
 * Pagination
 */
const Pagination = ({ totalPages }: { totalPages: number }): JSX.Element => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useTransitionRouter();
  const currentPage = Number(searchParams.get('page')) || 1;

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  return (
    <div className="flex gap-1">
      {Array.from(Array(Math.ceil(totalPages)).keys()).map((item) => (
        <button
          key={item}
          className={
            'size-8 rounded-full border border-white/30 border-solid hover:text-brand hover:border-brand text-white/90 transition-colors ' +
            (currentPage === Number(item)
              ? 'border-brand text-brand'
              : '')
          }
          onClick={() => {
            router.push(
              pathname + '?' + createQueryString('page', item.toString()),
            );
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
};

export default Pagination;
