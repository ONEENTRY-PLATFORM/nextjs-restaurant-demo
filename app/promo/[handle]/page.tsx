import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import { getImageUrl, getPageByUrl } from '@/app/api';

type PromoPageProps = {
  params: Promise<{ handle: string }>;
};

/**
 * Promo detail page — renders a single promo campaign by `pageUrl` marker
 * (e.g. `/promo/birthday`, `/promo/business_lunch`).
 *
 * Content comes from OneEntry CMS page under parent `promo/` with attributes:
 * `promo_image`, `promo_title`, `promo_subtitle`, `promo_cta`.
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
  const image = getImageUrl(
    attrs.promo_image?.value as
      | { downloadLink?: string }
      | Array<{ downloadLink?: string }>
      | null
      | undefined,
  );
  const title =
    (attrs.promo_title?.value as string | undefined) ??
    page.localizeInfos?.title ??
    '';
  const subtitle = attrs.promo_subtitle?.value as
    | Array<{ htmlValue?: string; plainValue?: string }>
    | string
    | undefined;
  const subtitleHtml = Array.isArray(subtitle)
    ? (subtitle[0]?.htmlValue ?? subtitle[0]?.plainValue ?? '')
    : (subtitle ?? '');
  const cta = (attrs.promo_cta?.value as string | undefined) ?? 'Order now';

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
            className="mx-auto mt-8 block h-[50px] w-full max-w-[615px] rounded-[10px] bg-custom-gradient font-bold text-[16px] uppercase text-white hover:bg-gradient-to-r-hover"
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
  const title =
    (attrs.promo_title?.value as string | undefined) ??
    page.localizeInfos?.title ??
    'Promo';
  const subtitle = attrs.promo_subtitle?.value as
    | Array<{ plainValue?: string }>
    | string
    | undefined;
  const description = Array.isArray(subtitle)
    ? (subtitle[0]?.plainValue ?? '')
    : (subtitle ?? '');
  return {
    title,
    description,
    openGraph: { type: 'article', title, description },
  };
}
