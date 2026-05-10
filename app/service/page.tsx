import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { JSX } from 'react';

import { getImageUrl, getPageByUrl } from '@/app/api';

export const dynamic = 'force-dynamic';

type ImageValue = { downloadLink?: string } | Array<{ downloadLink?: string }> | null | undefined;

/**
 * ServicePage — service landing page with logo and CTAs from attributes of the CMS `services` page.
 *
 * @returns {Promise<JSX.Element>} Promise resolving to JSX of the service entry page (logo, primary/secondary CTA buttons over background image).
 */
const ServicePage = async (): Promise<JSX.Element> => {
  const { page } = await getPageByUrl('services');
  const attrs = page?.attributeValues ?? {};

  const logo = getImageUrl(attrs.service_logo?.value as ImageValue);
  const bg = getImageUrl(attrs.service_bg_image?.value as ImageValue);
  const primaryCta = attrs.service_primary_cta?.value as string | undefined;
  const primaryHref = attrs.service_primary_href?.value as string | undefined;
  const secondaryCta = attrs.service_secondary_cta?.value as string | undefined;
  const secondaryHref = attrs.service_secondary_href?.value as string | undefined;

  return (
    <div
      className="min-h-screen bg-black bg-cover bg-no-repeat"
      style={bg ? { backgroundImage: `url('${bg}')` } : undefined}
    >
      <div className="mx-auto max-w-98.25 px-5">
        {logo ? (
          <div className="mx-auto mt-41.25 flex h-52.5 w-62.5 items-center justify-center">
            <Image
              src={logo}
              alt="logo"
              width={250}
              height={210}
              className="object-contain"
              priority
            />
          </div>
        ) : null}
        {primaryHref && primaryCta ? (
          <Link
            href={primaryHref}
            className="mt-42.5 flex h-15 w-full items-center justify-center rounded-card bg-custom_transparent backdrop-blur-card font-bold text-[17px] uppercase text-brand hover_btn_transp"
          >
            {primaryCta}
          </Link>
        ) : null}
        {secondaryHref && secondaryCta ? (
          <Link
            href={secondaryHref}
            className="mt-5 flex h-15 w-full items-center justify-center rounded-card bg-custom_btnorange backdrop-blur-card font-bold text-[18px] uppercase text-custom_white hover_btn_transp"
          >
            {secondaryCta}
          </Link>
        ) : null}
      </div>
    </div>
  );
};

export default ServicePage;

/**
 * generateMetadata — service entry page metadata from the CMS `services` page title.
 *
 * @returns {Promise<Metadata>} Promise resolving to the page metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getPageByUrl('services');
  return { title: page?.localizeInfos?.title };
}
