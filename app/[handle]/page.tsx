import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import { getPageByUrl } from '@/app/api';

/**
 * Generic renderer for CMS pages that don't have a dedicated route.
 * @param   {object}                          props        - Page properties.
 * @param   {Promise<{ handle: string }>}     props.params - Route parameters.
 * @returns {Promise<JSX.Element>}                         JSX of the generic page.
 */
const PageLayout = async ({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<JSX.Element> => {
  const { handle } = await params;
  const { page, isError } = await getPageByUrl(handle);

  if (isError || !page) {
    return notFound();
  }

  const title = page.localizeInfos?.title ?? '';
  const descriptionRaw = page.attributeValues?.description?.value as
    | Array<{ htmlValue?: string; plainValue?: string }>
    | undefined;
  const html = descriptionRaw?.[0]?.htmlValue ?? '';

  return (
    <article className="mx-auto flex w-full max-w-85 xs:max-w-none md:max-w-175 lg:max-w-250 xl:max-w-323 flex-col gap-6 px-4 py-10">
      {title ? (
        <h1 className="font-bold text-[24px] md:text-[32px] uppercase tracking-[0.02em] text-brand">
          {title}
        </h1>
      ) : null}
      {html ? (
        <div className="text-base text-paper/90" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p className="text-paper/70">
          This page has no content yet. Configure attribute{' '}
          <code className="text-brand">description</code> for page{' '}
          <code className="text-brand">{handle}</code> in OneEntry admin.
        </p>
      )}
    </article>
  );
};

export default PageLayout;

/**
 * Generates page metadata.
 * @param   {object}                          props        - Page properties.
 * @param   {Promise<{ handle: string }>}     props.params - Route parameters.
 * @returns {Promise<Metadata>}                            Page metadata.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const { page, isError } = await getPageByUrl(handle);

  if (isError || !page) {
    return notFound();
  }

  return {
    title: page.localizeInfos?.title,
    description: page.localizeInfos?.title,
    openGraph: { type: 'article' },
  };
}
