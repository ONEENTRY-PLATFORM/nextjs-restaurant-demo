import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import { getPageByUrl } from '@/app/api';
import RestaurantPhotoGallery from '@/components/restaurants/RestaurantPhotoGallery';

export const dynamic = 'force-dynamic';

type Photo = { downloadLink?: string };
type ScheduleInterval = { from?: string; to?: string };
type ListItem = { value?: string; title?: string };

const formatSchedule = (raw: unknown): string => {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  const arr = Array.isArray(raw) ? (raw as ScheduleInterval[]) : null;
  const first = arr ? arr[0] : (raw as ScheduleInterval);
  if (!first || (!first.from && !first.to)) return '';
  return `${first.from ?? ''} - ${first.to ?? ''}`;
};

// Атрибут `comforts` в OneEntry — тип `list` (массив объектов с
// `title`/`value`). Нормализуем к массиву строк.
const normalizeComforts = (raw: unknown): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return (raw as Array<string | ListItem>)
      .map((item) =>
        typeof item === 'string' ? item : (item.title ?? item.value ?? ''),
      )
      .filter(Boolean);
  }
  return [];
};

const buildOsmEmbed = (lat: number, lng: number): string => {
  const dLat = 0.005;
  const dLng = 0.01;
  const bbox = [lng - dLng, lat - dLat, lng + dLng, lat + dLat].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
};

/**
 * Single-restaurant страница.
 *
 * Два варианта верстки:
 *  - **Mobile** (< md) — порт `static-html/mob_about.html`: слайдер
 *    из всех фото, заголовок по центру, описание, comforts circles,
 *    далее блок «Contacts» с маленькой картой и address-pill.
 *  - **Desktop** (md+) — Figma «Подробнее 2» (file
 *    jC7SkO2Zor5u7Tk7N6ji8C, node 2413:1173):
 *      1) Заголовок-адрес сверху (orange uppercase, ~20px Bold).
 *      2) Photo grid 1+3: большое фото слева (aspect 956/678) +
 *         столбец из 3 миниатюр справа (aspect 278/197) — оба
 *         блока эквивалентны по высоте.
 *      3) Описание во всю ширину контента.
 *      4) Ряд: comforts circles слева + `BOOK A TABLE` справа.
 *      5) Контакты: 2 колонки — текст (Contacts / phone /
 *         address / opening hours / time) слева и широкая карта
 *         справа.
 *
 * Источник данных — OneEntry-страница с pageUrl = handle и
 * attribute set `restaurant` (`photos`, `address`, `description`,
 * `comforts`, `schedule`, `lat`, `long`, `phone`). 404, если страницы
 * нет (см. MISMATCH-LOG §C.7 — атрибуты подтверждены).
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
  const descriptionHtml = descriptionRaw?.[0]?.htmlValue ?? '';
  const descriptionPlain = descriptionRaw?.[0]?.plainValue ?? '';

  const bookHref = `/reservation?restaurant=${encodeURIComponent(handle)}`;

  return (
    <section className="section_layout">
      <div className="mb-5 flex items-center justify-between gap-4 text-sm text-paper/70">
        <Link href="/restaurants" className="hover:text-brand">
          ← All restaurants
        </Link>
      </div>

      {/* Заголовок — на десктопе небольшой, на мобиле центрируем как
          в `mob_about.html` */}
      <h1 className="text-center md:text-left font-bold text-xl md:text-[20px] uppercase tracking-[0.02em] text-brand">
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

      {/* Ряд comforts + BOOK A TABLE.
          - mobile: comforts по `mob_about.html` flex-row justify-between,
            кнопка резервации показана в самом низу страницы (по
            `mob_about.html` отдельной кнопки в hero нет — ставим её ниже).
          - desktop: 2 колонки в одной строке (Figma). */}
      <div className="mt-12 flex flex-col gap-10 md:flex-row md:items-center md:justify-between md:gap-15">
        {comforts.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-5 md:justify-start md:gap-7.5">
            {comforts.map((label, i) => (
              <div
                key={`${label}-${i}`}
                className="flex h-25 w-25 shrink-0 flex-col items-center justify-center rounded-full border border-brand p-3 text-center text-xs leading-3 text-brand"
              >
                {label}
              </div>
            ))}
          </div>
        ) : (
          <div />
        )}

        <Link
          href={bookHref}
          className="cart_btn hidden md:flex bg-custom_btnorange hover:bg-brand-hover md:max-w-114.5"
        >
          BOOK A TABLE
        </Link>
      </div>

      {/* Контакты:
          - mobile: «Contacts» заголовок → маленькая карта → address-pill (mob_about.html).
          - desktop: 2 колонки (Figma) — текст слева, широкая карта справа. */}
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
          {address ? (
            <p className="font-bold text-xl text-paper">{address}</p>
          ) : null}
          <p className="mt-3.75 font-bold text-xl uppercase text-brand">
            opening hours
          </p>
          {schedule ? (
            <p className="font-bold text-xl uppercase text-paper">{schedule}</p>
          ) : null}
        </div>

        {hasCoords ? (
          <iframe
            title={`Map for ${title}`}
            src={buildOsmEmbed(lat, lng)}
            className="h-45 w-full rounded-[5px] border-0 md:h-78"
            loading="lazy"
          />
        ) : (
          <div className="flex h-45 w-full items-center justify-center rounded-[5px] bg-ink/40 text-paper/60 md:h-78">
            Map unavailable
          </div>
        )}
      </div>

      {/* Мобильный CTA — на десктопе кнопка уже в ряду с comforts */}
      <div className="mt-10 md:hidden">
        <Link
          href={bookHref}
          className="cart_btn bg-custom_btnorange hover:bg-brand-hover"
        >
          BOOK A TABLE
        </Link>
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
