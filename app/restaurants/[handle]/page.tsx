import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import { getChildPagesByParentUrl, getPageByUrl } from '@/app/api';
import { PAGES } from '@/app/utils/constants';
import BookATableButton from '@/components/reservation/BookATableButton';
import RestaurantPhotoGallery from '@/components/restaurants/RestaurantPhotoGallery';

// Every restaurant child page is prerendered via `generateStaticParams` and served from the static
// cache (keeps the `loading.tsx` skeleton on navigation). `dynamicParams = false` makes Next answer
// any handle NOT in that list with a real framework HTTP 404 *before* the route renders — so unknown
// restaurants are hard 404s, not soft-404s (a `force-static` route can never set 404 from
// `notFound()`). New restaurants become reachable after the next build/revalidate of the params list.
export const dynamic = 'force-static';
export const revalidate = 300;
export const dynamicParams = false;

/**
 * generateStaticParams — enumerates every restaurant child page handle so each detail page is prerendered.
 *
 * Pairs with `dynamicParams = false` so handles outside this list resolve to a framework 404.
 *
 * @returns Promise resolving to the list of `{ handle }` route params (one per restaurant `pageUrl`).
 */
export async function generateStaticParams(): Promise<Array<{ handle: string }>> {
  const { pages = [] } = await getChildPagesByParentUrl(PAGES.restaurants);
  return pages.map(p => ({ handle: p.pageUrl }));
}

type Photo = { downloadLink?: string };
type ComfortItem = {
  title?: string;
  value?: string;
  extended?: {
    type?: string;
    value?: { downloadLink?: string };
  };
};
type Comfort = { title: string; iconUrl?: string };
type RichTextValue = Array<{ htmlValue?: string; plainValue?: string }>;

/**
 * pickRichTextHtml — extracts meaningful HTML from a OneEntry `text` attribute value.
 *
 * Treats `<p><br></p>` and similar empty rich-text payloads as no content (returns `''`),
 * so callers can short-circuit rendering of the surrounding section.
 *
 * @param   {unknown} raw - Raw attribute value (OneEntry rich-text array of `{ htmlValue, plainValue }`).
 * @returns Trimmed HTML string, or `''` when the value is missing/empty/whitespace-only.
 */
const pickRichTextHtml = (raw: unknown): string => {
  if (!Array.isArray(raw)) return '';
  const html = (raw as RichTextValue)[0]?.htmlValue ?? '';
  return /\S/.test(html.replace(/<[^>]*>/g, '')) ? html : '';
};

/**
 * normalizeComforts — flattens the `comforts` attribute (with optional image extension) to `{ title, iconUrl? }[]`.
 *
 * @param   {unknown}    raw - Raw OneEntry attribute value.
 * @returns Cleaned list of comfort items (drops entries without a title).
 */
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

/**
 * buildMapEmbed — Google Maps embed URL without an API key (`&hl=en` forces English labels).
 *
 * @param   {number} lat - Latitude.
 * @param   {number} lng - Longitude.
 * @returns Embed URL suitable for an `<iframe src>`.
 */
const buildMapEmbed = (lat: number, lng: number): string =>
  `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`;

/**
 * RestaurantPage — single-restaurant page (photos, comforts, contacts, map, BOOK A TABLE CTA).
 *
 * @param   {object}                              props        - Component props.
 * @param   {Promise<{ handle: string }>}         props.params - Async route params with the OneEntry restaurant `pageUrl` handle.
 * @returns Promise resolving to JSX of the restaurant detail page.
 */
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
  const whatsapp = (attrs.whatsapp?.value as string | undefined) ?? '';
  const instagram = (attrs.instagram?.value as string | undefined) ?? '';
  const email = (attrs.email?.value as string | undefined) ?? '';
  const parking = (attrs.parking?.value as string | undefined) ?? '';
  const cuisine = (attrs.cuisine?.value as string | undefined) ?? '';
  const bookingPolicy = (attrs.booking_policy?.value as string | undefined) ?? '';
  const liveEvents = (attrs.live_events?.value as string | undefined) ?? '';
  const openingHoursHtml = pickRichTextHtml(attrs.opening_hours?.value);
  const comforts = normalizeComforts(attrs.comforts?.value);
  const lat = Number(attrs.lat?.value);
  const lng = Number(attrs.long?.value);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const title = page.localizeInfos?.title ?? page.pageUrl ?? 'Restaurant';
  const descriptionRaw = attrs.description?.value as RichTextValue | undefined;
  const descriptionPlain = descriptionRaw?.[0]?.plainValue ?? '';
  const descriptionHtml = pickRichTextHtml(attrs.description?.value);

  const waNumber = whatsapp.replace(/[^\d]/g, '');
  const instagramHandle = instagram.replace(/^@/, '');

  return (
    <section className="section_layout pt-0">
      <div className="mb-5 flex items-center justify-between gap-4 text-sm text-paper/70">
        <Link href="/restaurants" className="hover:text-brand">
          ← All restaurants
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

      {cuisine || parking || bookingPolicy || liveEvents ? (
        <div className="mt-5 grid grid-cols-1 gap-5 text-base text-paper sm:grid-cols-2 md:grid-cols-4">
          {cuisine ? (
            <div className="flex flex-col gap-1">
              <span className="uppercase text-brand">Cuisine</span>
              <span>{cuisine}</span>
            </div>
          ) : null}
          {parking ? (
            <div className="flex flex-col gap-1">
              <span className="uppercase text-brand">Parking</span>
              <span>{parking}</span>
            </div>
          ) : null}
          {bookingPolicy ? (
            <div className="flex flex-col gap-1">
              <span className="uppercase text-brand">Booking policy</span>
              <span>{bookingPolicy}</span>
            </div>
          ) : null}
          {liveEvents ? (
            <div className="flex flex-col gap-1">
              <span className="uppercase text-brand">Live events</span>
              <span>{liveEvents}</span>
            </div>
          ) : null}
        </div>
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
          className="cart_btn text-uppercase hidden md:flex md:max-w-114.5"
        >
          Book a table
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
          {whatsapp ? (
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base text-paper hover:text-brand"
            >
              <span className="uppercase text-brand">WhatsApp: </span>
              {whatsapp}
            </a>
          ) : null}
          {email ? (
            <a href={`mailto:${email}`} className="text-base text-paper hover:text-brand">
              <span className="uppercase text-brand">Email: </span>
              {email}
            </a>
          ) : null}
          {instagram ? (
            <a
              href={`https://instagram.com/${instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base text-paper hover:text-brand"
            >
              <span className="uppercase text-brand">Instagram: </span>
              {instagram}
            </a>
          ) : null}
          {address ? <p className="font-bold text-xl text-paper">{address}</p> : null}
          <p className="mt-3.75 font-bold text-xl uppercase text-brand">Opening hours</p>
          {openingHoursHtml ? (
            <div
              className="text-base text-paper [&_p]:leading-snug"
              dangerouslySetInnerHTML={{ __html: openingHoursHtml }}
            />
          ) : null}
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
        <BookATableButton restaurantHandle={handle} className="cart_btn">
          Book a table
        </BookATableButton>
      </div>
    </section>
  );
};

export default RestaurantPage;

/**
 * generateMetadata — restaurant page metadata from the OneEntry page title.
 *
 * @param   {object}                              props        - Component props.
 * @param   {Promise<{ handle: string }>}         props.params - Async route params with the restaurant `pageUrl` handle.
 * @returns Promise resolving to the page metadata.
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
  const title = page.localizeInfos?.title ?? handle;
  return {
    title,
    description: title,
    openGraph: { type: 'article' },
  };
}
