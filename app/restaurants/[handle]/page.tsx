import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import { getPageByUrl } from '@/app/api';
import BookATableButton from '@/components/reservation/BookATableButton';
import RestaurantPhotoGallery from '@/components/restaurants/RestaurantPhotoGallery';

export const dynamic = 'force-dynamic';

type Photo = { downloadLink?: string };
type ScheduleInterval = { from?: string; to?: string };
type ComfortItem = {
  title?: string;
  value?: string;
  extended?: {
    type?: string;
    value?: { downloadLink?: string };
  };
};
type Comfort = { title: string; iconUrl?: string };

const formatSchedule = (raw: unknown): string => {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  const arr = Array.isArray(raw) ? (raw as ScheduleInterval[]) : null;
  const first = arr ? arr[0] : (raw as ScheduleInterval);
  if (!first || (!first.from && !first.to)) return '';
  return `${first.from ?? ''} - ${first.to ?? ''}`;
};

// `comforts` - list with `extended.type === 'image'`; normalized to `{ title, iconUrl? }[]`.
const normalizeComforts = (raw: unknown): Comfort[] => {
  if (!Array.isArray(raw)) return [];
  return (raw as ComfortItem[])
    .map(item => {
      if (typeof item === 'string') return { title: item };
      const title = item.title ?? item.value ?? '';
      if (!title) return null;
      const iconUrl =
        item.extended?.type === 'image' ? item.extended?.value?.downloadLink : undefined;
      return { title, iconUrl };
    })
    .filter((c): c is Comfort => c !== null);
};

// Google Maps embed without an API key; `&hl=en` forces English labels.
const buildMapEmbed = (lat: number, lng: number): string =>
  `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`;

/** RestaurantPage - single-restaurant page. */
const RestaurantPage = async ({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<JSX.Element> => {
  const { handle } = await params;
  const { page, isError } = await getPageByUrl(handle);

  if (isError || !page) {
    return notFound();
  }

  const attrs = page.attributeValues ?? {};
  const photos = (attrs.photos?.value as Photo[] | undefined) ?? [];
  const address = (attrs.address?.value as string | undefined) ?? '';
  const phone = (attrs.phone?.value as string | undefined) ?? '';
  const schedule = formatSchedule(attrs.schedule?.value);
  const comforts = normalizeComforts(attrs.comforts?.value);
  const lat = Number(attrs.lat?.value);
  const lng = Number(attrs.long?.value);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const title = page.localizeInfos?.title ?? page.pageUrl ?? 'Restaurant';
  const descriptionRaw = attrs.description?.value as
    | Array<{ htmlValue?: string; plainValue?: string }>
    | undefined;
  const descriptionHtmlRaw = descriptionRaw?.[0]?.htmlValue ?? '';
  const descriptionPlain = descriptionRaw?.[0]?.plainValue ?? '';
  // Rich-text sometimes returns `<p><br></p>` - treat html as meaningful only if there is text.
  const descriptionHtml = /\S/.test(descriptionHtmlRaw.replace(/<[^>]*>/g, ''))
    ? descriptionHtmlRaw
    : '';

  return (
    <section className="section_layout pt-0">
      <div className="mb-5 flex items-center justify-between gap-4 text-sm text-paper/70">
        <Link href="/restaurants" className="hover:text-brand">
          â† All restaurants
        </Link>
      </div>

      {/* Title */}
      <h1 className="text-center md:text-left font-bold text-xl md:text-xl uppercase tracking-fine text-brand">
        {title}
      </h1>

      <div className="mt-7.5">
        <RestaurantPhotoGallery photos={photos} alt={title} />
      </div>

      {descriptionHtml ? (
        <div
          className="mt-10 text-base text-paper/90 text-justify md:text-left"
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      ) : descriptionPlain ? (
        <p className="mt-10 text-base text-paper/90 text-justify md:text-left">
          {descriptionPlain}
        </p>
      ) : null}

      {/* Comforts row + BOOK A TABLE */}
      <div className="mt-12 flex flex-col gap-10 md:flex-row md:items-center md:justify-between md:gap-15">
        {comforts.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-5 md:justify-start md:gap-7.5">
            {comforts.map((c, i) => (
              <div
                key={`${c.title}-${i}`}
                className="flex h-25 w-25 shrink-0 flex-col items-center justify-center gap-1.5 rounded-full border border-brand p-3 text-center text-xs leading-3 text-brand"
              >
                {c.iconUrl ? (
                  <Image
                    src={c.iconUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                    unoptimized
                  />
                ) : null}
                <span>{c.title}</span>
              </div>
            ))}
          </div>
        ) : (
          <div />
        )}

        <BookATableButton
          restaurantHandle={handle}
          className="cart_btn hidden md:flex bg-custom_btnorange hover:bg-brand-hover md:max-w-114.5"
        >
          BOOK A TABLE
        </BookATableButton>
      </div>

      {/* Contacts */}
      <div className="mt-12 grid grid-cols-1 gap-7.5 md:grid-cols-[338fr_953fr] md:gap-10">
        <div className="flex flex-col gap-2.5">
          <p className="font-bold text-xl uppercase text-brand">Contacts</p>
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="font-bold text-xl uppercase text-paper hover:text-brand"
            >
              {phone}
            </a>
          ) : null}
          {address ? <p className="font-bold text-xl text-paper">{address}</p> : null}
          <p className="mt-3.75 font-bold text-xl uppercase text-brand">opening hours</p>
          {schedule ? <p className="font-bold text-xl uppercase text-paper">{schedule}</p> : null}
        </div>

        {hasCoords ? (
          <iframe
            title={`Map for ${title}`}
            src={buildMapEmbed(lat, lng)}
            className="h-45 w-full rounded-card border-0 md:h-78"
            loading="lazy"
          />
        ) : (
          <div className="flex h-45 w-full items-center justify-center rounded-card bg-ink/40 text-paper/60 md:h-78">
            Map unavailable
          </div>
        )}
      </div>

      {/* Mobile CTA - on desktop the button already sits in the comforts row. */}
      <div className="mt-10 md:hidden">
        <BookATableButton
          restaurantHandle={handle}
          className="cart_btn bg-custom_btnorange hover:bg-brand-hover"
        >
          BOOK A TABLE
        </BookATableButton>
      </div>
    </section>
  );
};

export default RestaurantPage;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const { page } = await getPageByUrl(handle);
  const title = page?.localizeInfos?.title ?? handle;
  return {
    title,
    description: title,
    openGraph: { type: 'article' },
  };
}
