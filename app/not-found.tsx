import Link from 'next/link';
import type { JSX } from 'react';

import { getPageByUrl } from '@/app/api';

// Opt out of static prerender — the shared layout chain includes
// `useSearchParams()` (search bar / filter bottom sheet) which Next.js
// requires to be wrapped in Suspense for static generation.
export const dynamic = 'force-dynamic';

/**
 * 404 page layout
 */
const NotFound = async (): Promise<JSX.Element> => {
  /** get page by url from the API. */
  const { page, isError } = await getPageByUrl('404');

  /** if no page data return fallback */
  if (isError || !page) {
    return (
      <div className="mx-auto flex min-h-80 w-full md:max-w-175 lg:max-w-250 xl:max-w-323 flex-col items-center justify-center py-8 text-paper">
        <h1 className="mb-10 text-6xl">404</h1>
        <Link href="/">Return home</Link>
      </div>
    );
  }

  /** extract data from page */
  const { localizeInfos, attributeValues } = page;

  return (
    <div className="mx-auto flex min-h-96 w-full md:max-w-175 lg:max-w-250 xl:max-w-323 flex-col items-center justify-center py-8 text-paper">
      <h1 className="mb-10 text-6xl">{localizeInfos?.title}</h1>
      <p className="mb-4">
        {
          (
            attributeValues?.error_description?.value as
              | Array<{ plainValue?: string }>
              | undefined
          )?.[0]?.plainValue
        }
      </p>
      <Link
        href="/"
        className="rounded-[5px] border border-brand text-brand font-normal px-4 py-2 hover_btn_white"
      >
        Return home
      </Link>
    </div>
  );
};

export default NotFound;
