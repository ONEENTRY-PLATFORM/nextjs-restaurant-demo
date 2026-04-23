import type { JSX } from 'react';

import { getChildPagesByParentUrl } from '@/app/api';

import PromoCard from './PromoCard';

/**
 * PromoGrid — fetches all promo child pages under the `blog` parent in
 * OneEntry CMS and renders them as a responsive grid of {@link PromoCard}.
 *
 * Graceful fallback: if the parent page `blog` is not configured in the admin
 * panel yet (returns `"Resource is closed"` or similar), the component logs a
 * warning and renders nothing instead of crashing the page.
 * @returns {Promise<JSX.Element>} Promo grid JSX (or empty fragment on error).
 */
const PromoGrid = async (): Promise<JSX.Element> => {
  const { pages, isError, error } = await getChildPagesByParentUrl('blog');

  if (isError || !pages || pages.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(
      '[PromoGrid] No promo pages found under parent "blog" — check OneEntry admin.',
      error,
    );
    return <></>;
  }

  return (
    <section className="mx-auto w-full max-w-88 md:max-w-175 lg:max-w-250 xl:max-w-323 px-2.5 py-7.5 md:py-10">
      <h2 className="mb-5 font-bold text-[16px] md:text-[20px] uppercase tracking-[0.02em] text-brand">
        Actions
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <PromoCard key={page.id} page={page} />
        ))}
      </div>
    </section>
  );
};

export default PromoGrid;
