import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { JSX } from 'react';

import { getImageUrl } from '@/app/api/api/api';
import { getPageByUrl } from '@/app/api/server/pages/getPageByUrl';
import { PAGES } from '@/app/utils/constants';

export const dynamic = 'force-static';
export const revalidate = 300;

type ImageValue = { downloadLink?: string } | Array<{ downloadLink?: string }> | null | undefined;

/**
 * ServicePage — service landing page with logo and CTAs from attributes of the CMS `services` page.
 *
 * @returns Promise resolving to JSX of the service entry page (logo, primary/secondary CTA buttons over background image).
 */
const ServicePage = async (): Promise<JSX.Element> => {
  const { page } = await getPageByUrl(PAGES.services);
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
            className="hover_btn_transp mt-42.5 flex h-15 w-full items-center justify-center rounded-card bg-custom_transparent text-[17px] font-bold text-brand uppercase backdrop-blur-card"
          >
            {primaryCta}
          </Link>
        ) : null}
        {secondaryHref && secondaryCta ? (
          <Link
            href={secondaryHref}
            className="hover_btn_transp mt-5 flex h-15 w-full items-center justify-center rounded-card bg-custom_btnorange text-[18px] font-bold text-custom_white uppercase backdrop-blur-card"
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
 * @returns Promise resolving to the page metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getPageByUrl(PAGES.services);
  return { title: page?.localizeInfos?.title };
}
