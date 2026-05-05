import Link from 'next/link';
import type { JSX } from 'react';

import { getPageByUrl } from '@/app/api';

// Отключаем static prerender — общая цепочка layout-ов включает
// `useSearchParams()` (search bar / filter bottom sheet), которые Next.js
// требует оборачивать в Suspense для static-генерации.
export const dynamic = 'force-dynamic';

/**
 * Layout страницы 404
 */
const NotFound = async (): Promise<JSX.Element> => {
  /** получаем страницу по url из API. */
  const { page, isError } = await getPageByUrl('404');

  /** если данных страницы нет — возвращаем fallback */
  if (isError || !page) {
    return (
      <div className="mx-auto flex min-h-80 w-full md:max-w-175 lg:max-w-250 xl:max-w-323 flex-col items-center justify-center py-8 text-paper">
        <h1 className="mb-10 text-6xl">404</h1>
        <Link href="/">Return home</Link>
      </div>
    );
  }

  /** извлекаем данные из page */
  const { localizeInfos, attributeValues } = page;

  return (
    <div className="mx-auto flex min-h-96 w-full md:max-w-175 lg:max-w-250 xl:max-w-323 flex-col items-center justify-center py-8 text-paper">
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
        className="rounded-[5px] border border-brand text-brand font-normal px-4 py-2 hover_btn_white"
      >
        Return home
      </Link>
    </div>
  );
};

export default NotFound;
