import type { JSX } from 'react';

import Skeleton from '@/components/shared/skeletons/Skeleton';

/**
 * Loading — skeleton shown while the support page (`/support`) loads.
 *
 * Reproduces heading, description, the two contact CTA cards and the contact-form container.
 *
 * @returns JSX of the support loading skeleton.
 */
export default function Loading(): JSX.Element {
  return (
    <section aria-hidden="true" className="section_layout">
      {/* Heading + description */}
      <Skeleton className="mb-5 h-8 w-2/3 max-w-100 md:h-[32px]" />
      <Skeleton className="mb-8 h-4 w-3/4 max-w-150 rounded-full" />

      {/* Contact CTA cards */}
      <div className="mb-8 flex flex-col gap-6.25">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-[20px] border border-paper/30 px-5 pb-5 pt-3">
            <Skeleton className="mx-auto h-5 w-2/3 max-w-72 rounded-full" />
            <div className="mt-4 flex justify-center gap-15">
              <Skeleton className="size-11 rounded-full" />
              <Skeleton className="size-11 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Contact form */}
      <div className="rounded-xl bg-ink/40 p-5">
        <Skeleton className="mb-4 h-5 w-40" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-11 w-full rounded-card" />
          <Skeleton className="h-11 w-full rounded-card" />
          <Skeleton className="h-11 w-full rounded-card" />
          <Skeleton className="h-24 w-full rounded-card" />
          <Skeleton className="h-12 w-full rounded-card" />
        </div>
      </div>
    </section>
  );
}
