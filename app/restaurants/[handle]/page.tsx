import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import getPhotosBlurMap from '@/app/api/lqip/getPhotosBlurMap';
import { getChildPagesByParentUrl } from '@/app/api/server/pages/getChildPagesByParentUrl';
import { getPageByUrl } from '@/app/api/server/pages/getPageByUrl';
import { t } from '@/app/dictionaries';
import { PAGES } from '@/app/utils/constants';
import { sanitizeHtml } from '@/app/utils/sanitizeHtml';
import BookATableButton from '@/components/reservation/BookATableButton';
import RestaurantPhotoGallery from '@/components/restaurants/RestaurantPhotoGallery';
import { pickRichTextHtml, unwrapRichText } from '@/components/utils';

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
  const blurMap = await getPhotosBlurMap(photos);
  const address = (attrs.address?.value as string | undefined) ?? '';
  const phone = (attrs.phone?.value as string | undefined) ?? '';
  const whatsapp = (attrs.whatsapp?.value as string | undefined) ?? '';
  const instagram = (attrs.instagram?.value as string | undefined) ?? '';
  const email = (attrs.email?.value as string | undefined) ?? '';
  const parking = (attrs.parking?.value as string | undefined) ?? '';
  const cuisine = (attrs.cuisine?.value as string | undefined) ?? '';
  const bookingPolicy = (attrs.booking_policy?.value as string | undefined) ?? '';
  const liveEvents = (attrs.live_events?.value as string | undefined) ?? '';
  const openingHoursHtml = sanitizeHtml(pickRichTextHtml(attrs.opening_hours?.value));
  const comforts = normalizeComforts(attrs.comforts?.value);
  // Unfilled string attributes arrive as `null` and Number(null) === 0 — check
  // "not filled" before coercion so empty coords fall through to the map placeholder.
  const latRaw = attrs.lat?.value;
  const lngRaw = attrs.long?.value;
  const lat = latRaw == null || latRaw === '' ? NaN : Number(latRaw);
  const lng = lngRaw == null || lngRaw === '' ? NaN : Number(lngRaw);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const title = page.localizeInfos?.title ?? page.pageUrl ?? 'Restaurant';
  const descriptionPlain = unwrapRichText(attrs.description?.value)?.plainValue ?? '';
  const descriptionHtml = sanitizeHtml(pickRichTextHtml(attrs.description?.value));

  const waNumber = whatsapp.replace(/[^\d]/g, '');
  const instagramHandle = instagram.replace(/^@/, '');

  const labels = {
    back: await t('restaurants_back_link', '← All restaurants'),
    cuisine: await t('cuisine_label', 'Cuisine'),
    parking: await t('parking_label', 'Parking'),
    bookingPolicy: await t('booking_policy_label', 'Booking policy'),
    liveEvents: await t('live_events_label', 'Live events'),
    bookTable: await t('book_button', 'Book a table'),
    contacts: await t('contacts_title', 'Contacts'),
    whatsapp: await t('whatsapp_label', 'WhatsApp:'),
    email: await t('email_label', 'Email:'),
    instagram: await t('instagram_label', 'Instagram:'),
    openingHours: await t('opening_hours_title', 'Opening hours'),
    mapUnavailable: await t('map_unavailable_text', 'Map unavailable'),
  };

  return (
    <section className="section_layout pt-0">
      <div className="mb-5 flex items-center justify-between gap-4 text-sm text-paper/70">
        <Link href="/restaurants" className="hover:text-brand">
          {labels.back}
        </Link>
      </div>

      {/* Title */}
      <h1 className="text-center text-xl font-bold tracking-fine text-brand uppercase md:text-left md:text-xl">
        {title}
      </h1>

      <div className="mt-7.5">
        <RestaurantPhotoGallery photos={photos} alt={title} blurMap={blurMap} />
      </div>

      {descriptionHtml ? (
        <div
          className="mt-10 text-justify text-base text-paper/90 md:text-left"
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      ) : descriptionPlain ? (
        <p className="mt-10 text-justify text-base text-paper/90 md:text-left">
          {descriptionPlain}
        </p>
      ) : null}

      {cuisine || parking || bookingPolicy || liveEvents ? (
        <div className="mt-5 grid grid-cols-1 gap-5 text-base text-paper sm:grid-cols-2 md:grid-cols-4">
          {cuisine ? (
            <div className="flex flex-col gap-1">
              <span className="text-brand uppercase">{labels.cuisine}</span>
              <span>{cuisine}</span>
            </div>
          ) : null}
          {parking ? (
            <div className="flex flex-col gap-1">
              <span className="text-brand uppercase">{labels.parking}</span>
              <span>{parking}</span>
            </div>
          ) : null}
          {bookingPolicy ? (
            <div className="flex flex-col gap-1">
              <span className="text-brand uppercase">{labels.bookingPolicy}</span>
              <span>{bookingPolicy}</span>
            </div>
          ) : null}
          {liveEvents ? (
            <div className="flex flex-col gap-1">
              <span className="text-brand uppercase">{labels.liveEvents}</span>
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
                className="flex size-25 shrink-0 flex-col items-center justify-center gap-1.5 rounded-full border border-brand p-3 text-center text-xs leading-3 text-brand"
              >
                {c.iconUrl ? (
                  <Image
                    src={c.iconUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="size-10 object-contain"
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
          {labels.bookTable}
        </BookATableButton>
      </div>

      {/* Contacts */}
      <div className="mt-12 grid grid-cols-1 gap-7.5 md:grid-cols-[338fr_953fr] md:gap-10">
        <div className="flex flex-col gap-2.5">
          <p className="text-xl font-bold text-brand uppercase">{labels.contacts}</p>
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="text-xl font-bold text-paper uppercase hover:text-brand"
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
              <span className="text-brand uppercase">{labels.whatsapp}</span> {whatsapp}
            </a>
          ) : null}
          {email ? (
            <a href={`mailto:${email}`} className="text-base text-paper hover:text-brand">
              <span className="text-brand uppercase">{labels.email}</span> {email}
            </a>
          ) : null}
          {instagram ? (
            <a
              href={`https://instagram.com/${instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base text-paper hover:text-brand"
            >
              <span className="text-brand uppercase">{labels.instagram}</span> {instagram}
            </a>
          ) : null}
          {address ? <p className="text-xl font-bold text-paper">{address}</p> : null}
          <p className="mt-3.75 text-xl font-bold text-brand uppercase">{labels.openingHours}</p>
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
            {labels.mapUnavailable}
          </div>
        )}
      </div>

      {/* Mobile CTA - on desktop the button already sits in the comforts row. */}
      <div className="mt-10 md:hidden">
        <BookATableButton restaurantHandle={handle} className="cart_btn">
          {labels.bookTable}
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
