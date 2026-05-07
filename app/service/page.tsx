import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { JSX } from 'react';

import { getImageUrl, getPageByUrl } from '@/app/api';

export const dynamic = 'force-dynamic';

type ImageValue = { downloadLink?: string } | Array<{ downloadLink?: string }> | null | undefined;

/**
 * Точка входа сервиса — лендинг с логотипом и двумя основными CTA:
 * «Food delivery» (→ `/shop`) и «Book a table» (→ `/restaurants`).
 *
 * Все тексты и изображения — из атрибутов CMS-страницы `services`:
 * `service_logo`, `service_bg_image`,
 * `service_primary_cta` / `service_primary_href`,
 * `service_secondary_cta` / `service_secondary_href`.
 * @returns {Promise<JSX.Element>} JSX страницы входа сервиса.
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
            className="mt-42.5 flex h-15 w-full items-center justify-center rounded-[5px] bg-custom_transparent backdrop-blur-[10px] font-bold text-[17px] uppercase text-brand hover_btn_transp"
          >
            {primaryCta}
          </Link>
        ) : null}
        {secondaryHref && secondaryCta ? (
          <Link
            href={secondaryHref}
            className="mt-5 flex h-15 w-full items-center justify-center rounded-[5px] bg-custom_btnorange backdrop-blur-[10px] font-bold text-[18px] uppercase text-custom_white hover_btn_transp"
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
 * Генерирует метаданные для маршрута входа сервиса.
 * @returns {Promise<Metadata>} Метаданные страницы.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getPageByUrl('services');
  return { title: page?.localizeInfos?.title };
}
