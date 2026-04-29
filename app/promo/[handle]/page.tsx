import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import { getImageUrl, getPageByUrl } from '@/app/api';

type PromoPageProps = {
  params: Promise<{ handle: string }>;
};

type ImageValue =
  | { downloadLink?: string }
  | Array<{ downloadLink?: string }>
  | null
  | undefined;

type DescriptionValue = Array<{
  plainValue?: string;
  htmlValue?: string;
  mdValue?: string;
}>;

/**
 * Promo detail page — renders a single promo campaign by `pageUrl` marker
 * (e.g. `/promo/birthday_offer`, `/promo/business_lunch`).
 *
 * Driven by OneEntry `blog` child page attributes (`blog_page` set). Real
 * attributes:
 *   - `bg_image`    (image) — desktop hero;
 *   - `banner`      (image) — mobile fallback if `bg_image` is empty;
 *   - `description` (text)  — markdown/html body;
 *   - `action_type` (list)  — `[{ title }]` for the CTA label.
 * @param   {PromoPageProps}       props - Next.js dynamic route props.
 * @returns {Promise<JSX.Element>}       Promo detail JSX.
 * @see {@link https://doc.oneentry.cloud/docs/pages OneEntry CMS docs}
 */
const PromoDetailPage = async ({
  params,
}: PromoPageProps): Promise<JSX.Element> => {
  const { handle } = await params;
  const { page, isError } = await getPageByUrl(handle);

  if (isError || !page) {
    return notFound();
  }

  const attrs = page.attributeValues ?? {};
  const image =
    getImageUrl(attrs.bg_image?.value as ImageValue) ||
    getImageUrl(attrs.banner?.value as ImageValue);
  const title = page.localizeInfos?.title ?? '';
  const description = attrs.description?.value as DescriptionValue | undefined;
  const subtitleHtml =
    description?.[0]?.htmlValue ?? description?.[0]?.plainValue ?? '';
  const actionType = attrs.action_type?.value as
    | Array<{ title?: string }>
    | undefined;
  const cta = actionType?.[0]?.title ?? 'Order now';

  return (
    <section className="mx-auto w-full max-w-88 md:max-w-175 lg:max-w-250 xl:max-w-323 px-4 py-10">
      <div className="relative overflow-hidden rounded-[20px] bg-ink">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={title} className="h-auto w-full object-cover" />
        ) : null}
        <div className="p-6 md:p-10">
          <h1 className="mb-5 font-bold text-[20px] md:text-[32px] uppercase tracking-[0.02em] text-brand">
            {title}
          </h1>
          {subtitleHtml ? (
            <div
              className="text-base text-paper/90"
              dangerouslySetInnerHTML={{ __html: subtitleHtml }}
            />
          ) : null}
          <button
            type="button"
            className="mx-auto mt-8 block h-12.5 w-full max-w-153.75 rounded-[10px] bg-custom-gradient font-bold text-[16px] uppercase text-white hover:bg-gradient-to-r-hover"
          >
            {cta}
          </button>
        </div>
      </div>
    </section>
  );
};

export default PromoDetailPage;

/**
 * Generate page metadata for the promo detail route.
 * @param   {PromoPageProps}    props - Next.js props.
 * @returns {Promise<Metadata>}       Metadata object.
 */
export async function generateMetadata({
  params,
}: PromoPageProps): Promise<Metadata> {
  const { handle } = await params;
  const { page } = await getPageByUrl(handle);
  if (!page) {
    return { title: 'Promo' };
  }
  const attrs = page.attributeValues ?? {};
  const title = page.localizeInfos?.title ?? 'Promo';
  const description = attrs.description?.value as DescriptionValue | undefined;
  const descriptionText = description?.[0]?.plainValue ?? '';
  return {
    title,
    description: descriptionText,
    openGraph: { type: 'article', title, description: descriptionText },
  };
}
