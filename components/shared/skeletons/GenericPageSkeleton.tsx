import type { JSX } from 'react';

import Skeleton from '@/components/shared/skeletons/Skeleton';

const BODY_LINES = ['w-full', 'w-11/12', 'w-10/12', 'w-9/12', 'w-11/12', 'w-7/12'];

/**
 * GenericPageSkeleton — route-level skeleton for the generic CMS page route (`/[handle]`).
 *
 * Mirrors the article wrapper of `app/[handle]/page.tsx`: a title bar followed by a few body
 * lines, so the leave→enter transition has content to fade in instead of an empty gap.
 *
 * @returns JSX of the generic page loading skeleton.
 */
export default function GenericPageSkeleton(): JSX.Element {
  return (
    <article className="skeleton-fade-in mx-auto flex w-full max-w-85 flex-col gap-6 px-4 py-10 xs:max-w-none md:max-w-175 lg:max-w-250 xl:max-w-323">
      <Skeleton className="h-8 w-2/3 md:h-10" />
      <div className="flex flex-col gap-3">
        {BODY_LINES.map((w, i) => (
          <Skeleton key={i} className={`h-4 rounded-full ${w}`} />
        ))}
      </div>
    </article>
  );
}
