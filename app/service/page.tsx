import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { JSX } from 'react';

import { getImageUrl, getPageByUrl } from '@/app/api';

export const dynamic = 'force-dynamic';

/**
 * Service entry-point — landing screen with logo and two primary CTAs:
 * "Food delivery" (→ `/shop`) and "Book a table" (→ `/reservation`).
 *
 * Copy and hero image come from OneEntry `service` CMS page attributes:
 * `service_logo` (image), `service_bg_image` (image),
 * `service_primary_cta` / `service_primary_href`,
 * `service_secondary_cta` / `service_secondary_href`.
 * @returns {Promise<JSX.Element>} Service entry page JSX.
 */
const ServicePage = async (): Promise<JSX.Element> => {
  const { page } = await getPageByUrl('services');
  const attrs = page?.attributeValues ?? {};

  const logo =
    getImageUrl(
      attrs.service_logo?.value as
        | { downloadLink?: string }
        | Array<{ downloadLink?: string }>
        | null
        | undefined,
    ) || '/images/icons/logo.svg';
  const bg = getImageUrl(
    attrs.service_bg_image?.value as
      | { downloadLink?: string }
      | Array<{ downloadLink?: string }>
      | null
      | undefined,
  );
  const primaryCta =
    (attrs.service_primary_cta?.value as string | undefined) ?? 'FOOD DELIVERY';
  const primaryHref =
    (attrs.service_primary_href?.value as string | undefined) ?? '/shop';
  const secondaryCta =
    (attrs.service_secondary_cta?.value as string | undefined) ??
    'BOOK A TABLE';
  const secondaryHref =
    (attrs.service_secondary_href?.value as string | undefined) ??
    '/reservation';

  return (
    <div
      className="min-h-screen bg-black bg-cover bg-no-repeat"
      style={
        bg
          ? { backgroundImage: `url('${bg}')` }
          : { backgroundImage: `url('/images/picture/bg_service.png')` }
      }
    >
      <div className="mx-auto max-w-[393px] px-5">
        <div className="mx-auto mt-[165px] flex h-[210px] w-[250px] items-center justify-center">
          <Image
            src={logo}
            alt="logo"
            width={250}
            height={210}
            className="object-contain"
            priority
          />
        </div>
        <Link
          href={primaryHref}
          className="mt-[170px] flex h-[60px] w-full items-center justify-center rounded-[5px] bg-custom_transparent backdrop-blur-[10px] font-bold text-[17px] uppercase text-brand hover_btn_transp"
        >
          {primaryCta}
        </Link>
        <Link
          href={secondaryHref}
          className="mt-[20px] flex h-[60px] w-full items-center justify-center rounded-[5px] bg-custom_btnorange backdrop-blur-[10px] font-bold text-[17px] uppercase text-custom_white hover_btn_transp"
        >
          {secondaryCta}
        </Link>
      </div>
    </div>
  );
};

export default ServicePage;

/**
 * Generate metadata for the service entry route.
 * @returns {Promise<Metadata>} Page metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getPageByUrl('services');
  const title =
    page?.localizeInfos?.title ?? 'Restaurant — Delivery & Reservation';
  return {
    title,
    description: 'Choose: food delivery or book a table at our restaurant',
  };
}
