import Link from 'next/link';
import type { JSX } from 'react';

import { getPageByUrl } from '@/app/api';

// Force-dynamic: the layout chain uses `useSearchParams()`.
export const dynamic = 'force-dynamic';

/**
 * NotFound — 404 page layout, content driven by the OneEntry `404` page.
 *
 * @returns Promise resolving to JSX of the 404 page (CMS title + `error_description` attribute, with a fallback shell).
 */
const NotFound = async (): Promise<JSX.Element> => {
  const { page, isError } = await getPageByUrl('404');

  if (isError || !page) {
    return (
      <div className="mx-auto flex min-h-80 w-full max-w-85 xs:max-w-none md:max-w-175 lg:max-w-250 xl:max-w-323 flex-col items-center justify-center px-4 py-8 text-paper">
        <h1 className="mb-10 text-6xl">404</h1>
        <Link href="/">Return home</Link>
      </div>
    );
  }

  const { localizeInfos, attributeValues } = page;

  return (
    <div className="mx-auto flex min-h-96 w-full max-w-85 xs:max-w-none md:max-w-175 lg:max-w-250 xl:max-w-323 flex-col items-center justify-center px-4 py-8 text-paper">
      <h1 className="mb-10 text-6xl">{localizeInfos?.title}</h1>
      <p className="mb-4">
        {
          (
            attributeValues?.error_description?.value as Array<{ plainValue?: string }> | undefined
          )?.[0]?.plainValue
        }
      </p>
      <Link
        href="/"
        className="rounded-card border border-brand text-brand font-normal px-4 py-2 hover_btn_white"
      >
        Return home
      </Link>
    </div>
  );
};

export default NotFound;
