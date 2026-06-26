import type { JSX } from 'react';

import Skeleton from '@/components/shared/skeletons/Skeleton';

/**
 * Loading — skeleton shown while a generic CMS content page (`/[handle]`) loads.
 *
 * Mirrors the page `<article>` wrapper: a title bar over a stack of paragraph lines.
 *
 * @returns JSX of the content page loading skeleton.
 */
export default function Loading(): JSX.Element {
  return (
    <article
      aria-hidden="true"
      className="mx-auto flex w-full max-w-85 flex-col gap-6 px-4 py-10 xs:max-w-none md:max-w-175 lg:max-w-250 xl:max-w-323"
    >
      <Skeleton className="h-8 w-2/3 max-w-100 md:h-[32px]" />
      <div className="flex flex-col gap-3">
        {['w-full', 'w-11/12', 'w-full', 'w-5/6', 'w-3/4', 'w-2/3'].map(w => (
          <Skeleton key={w} className={`h-4 rounded-full ${w}`} />
        ))}
      </div>
    </article>
  );
}
