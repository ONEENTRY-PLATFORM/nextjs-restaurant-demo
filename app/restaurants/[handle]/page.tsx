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
type ScheduleRule = {
  timeIntervals?: Array<[string, string]>;
};
type ScheduleGroup = {
  values?: ScheduleRule[];
};
type DaySchedule = { label: string; hours: string };

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
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
 * pad2 — zero-pads an integer to two digits (`9` → `"09"`).
 *
 * @param   {number} n - Value to pad; non-numeric input renders as `"00"`.
 * @returns Two-character string representation.
 */
const pad2 = (n: number): string => String(n ?? 0).padStart(2, '0');

/**
 * mergeRanges — merges overlapping/adjacent `[fromMin, toMin]` ranges into a minimal set of spans.
 *
 * @param   {Array<[number, number]>} ranges - Half-open ranges expressed in minutes from midnight.
 * @returns New sorted array with overlapping/contiguous ranges collapsed.
 */
const mergeRanges = (ranges: Array<[number, number]>): Array<[number, number]> => {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const [first, ...rest] = sorted;
  if (!first) return [];
  const merged: Array<[number, number]> = [first];
  for (const next of rest) {
    const last = merged[merged.length - 1]!;
    if (next[0] <= last[1]) {
      last[1] = Math.max(last[1], next[1]);
    } else {
      merged.push(next);
    }
  }
  return merged;
};

/**
 * formatRange — renders one merged minute range as `HH:MM - HH:MM`.
 *
 * @param   {[number, number]} range - `[fromMin, toMin]` pair in minutes from midnight (UTC).
 * @returns Formatted span like `"10:00 - 20:00"`.
 */
const formatRange = ([from, to]: [number, number]): string =>
  `${pad2(Math.floor(from / 60))}:${pad2(from % 60)} - ${pad2(Math.floor(to / 60))}:${pad2(to % 60)}`;

/**
 * formatSchedule — converts the OneEntry `timeInterval` attribute into grouped weekday rows.
 *
 * Uses `values[].timeIntervals` (the pre-computed `[startISO, endISO]` pairs that already honor
 * `inEveryWeek` / `exceptions` / `intervals`). Groups by UTC weekday, merges adjacent slots, then
 * collapses consecutive Mon→Sun days that share identical hours into a range label (e.g. `Mon-Sat`).
 * Days with no intervals collapse into a `Closed` row.
 *
 * @param   {unknown} raw - Raw attribute value (OneEntry timeInterval array).
 * @returns Ordered grouped schedule rows; empty array when the attribute is missing/unusable.
 */
const formatSchedule = (raw: unknown): DaySchedule[] => {
  if (!Array.isArray(raw)) return [];
  const groups = raw as ScheduleGroup[];
  const byWeekday: Array<Array<[number, number]>> = [[], [], [], [], [], [], []];
  let hasAny = false;
  for (const group of groups) {
    for (const rule of group?.values ?? []) {
      for (const pair of rule?.timeIntervals ?? []) {
        const start = pair?.[0];
        const end = pair?.[1];
        if (!start || !end) continue;
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) continue;
        // `getUTCDay` returns 0=Sun..6=Sat; map to Mon=0..Sun=6.
        const weekday = (startDate.getUTCDay() + 6) % 7;
        const fromMin = startDate.getUTCHours() * 60 + startDate.getUTCMinutes();
        const toMin = endDate.getUTCHours() * 60 + endDate.getUTCMinutes();
        if (toMin <= fromMin) continue;
        byWeekday[weekday]!.push([fromMin, toMin]);
        hasAny = true;
      }
    }
  }
  if (!hasAny) return [];

  const perDayHours = WEEKDAY_LABELS.map((_, i) => {
    return mergeRanges(byWeekday[i] ?? [])
      .map(formatRange)
      .join(', ');
  });

  const rows: DaySchedule[] = [];
  let runStart = 0;
  for (let i = 1; i <= 7; i += 1) {
    if (i === 7 || perDayHours[i] !== perDayHours[runStart]) {
      const startLabel = WEEKDAY_LABELS[runStart]!;
      const endLabel = WEEKDAY_LABELS[i - 1]!;
      const label = runStart === i - 1 ? startLabel : `${startLabel}-${endLabel}`;
      rows.push({ label, hours: perDayHours[runStart] ?? '' });
      runStart = i;
    }
  }
  return rows;
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
          {address ? <p className="font-bold text-xl text-paper">{address}</p> : null}
          <p className="mt-3.75 font-bold text-xl uppercase text-brand">Opening hours</p>
          {schedule.length > 0 ? (
            <ul className="flex flex-col gap-1 font-bold text-xl uppercase text-paper">
              {schedule.map(row => (
                <li key={row.label} className="flex items-baseline gap-2.5">
                  <span className="shrink-0 text-brand">{row.label}</span>
                  <span>{row.hours || 'Closed'}</span>
                </li>
              ))}
            </ul>
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
  const { page } = await getPageByUrl(handle);
  const title = page?.localizeInfos?.title ?? handle;
  return {
    title,
    description: title,
    openGraph: { type: 'article' },
  };
}
