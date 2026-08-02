import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { JSX } from 'react';

import { getChildPagesByParentUrl, getPageByUrl } from '@/app/api';
import getPhotosBlurMap from '@/app/api/lqip/getPhotosBlurMap';
import { t } from '@/app/dictionaries';
import { PAGES } from '@/app/utils/constants';
import RestaurantPhotoSlider from '@/components/restaurants/RestaurantPhotoSlider';
import { parseScheduleSlots, unwrapRichText } from '@/components/utils';

export const dynamic = 'force-static';
export const revalidate = 300;

type RestaurantPhoto = { downloadLink?: string };

type RestaurantCard = {
  id: number;
  href: string;
  title: string;
  address: string;
  schedule: string;
  photos: RestaurantPhoto[];
  index: number;
};

/**
 * formatSchedule — renders the OneEntry `timeInterval` value as an `HH:MM - HH:MM` opening window.
 *
 * Passes plain strings through, otherwise flattens the interval groups via
 * {@link parseScheduleSlots}, takes the earliest slot start and the latest slot end across all
 * entries, and formats them as `HH:MM - HH:MM`. Returns an empty string when no slot is parseable.
 *
 * @param   {unknown} raw - Raw `schedule` attribute value (string or `timeInterval` groups array).
 * @returns Formatted `HH:MM - HH:MM` string, or empty when no interval is present.
 */
const formatSchedule = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  const pad = (n: number): string => String(n).padStart(2, '0');
  let startMin: number | null = null;
  let endMin: number | null = null;
  for (const entry of parseScheduleSlots(raw)) {
    for (const pair of entry.times ?? []) {
      const from = pair[0];
      const to = pair[1];
      if (!from || !to) continue;
      const fromMin = from.hours * 60 + from.minutes;
      const toMin = to.hours * 60 + to.minutes;
      if (startMin === null || fromMin < startMin) startMin = fromMin;
      if (endMin === null || toMin > endMin) endMin = toMin;
    }
  }
  if (startMin === null || endMin === null) return '';
  const fmt = (min: number): string => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
  return `${fmt(startMin)} - ${fmt(endMin)}`;
};

/**
 * buildCard — maps a OneEntry restaurant page to a `RestaurantCard` view-model.
 *
 * @param   {IPagesEntity}    page  - OneEntry page entity for a restaurant child.
 * @param   {number}          index - 1-based card index used by the numbered badge in the UI.
 * @returns Normalised card data for `<RestaurantCardView />`.
 */
const buildCard = (page: IPagesEntity, index: number): RestaurantCard => {
  const attrs = page.attributeValues ?? {};
  const photos = (attrs.photos?.value as RestaurantPhoto[] | undefined) ?? [];
  const address = (attrs.address?.value as string | undefined) ?? '';
  const schedule = formatSchedule(attrs.schedule?.value);
  const title = page.localizeInfos?.title ?? page.pageUrl ?? 'Restaurant';
  return {
    id: page.id,
    href: `/restaurants/${page.pageUrl}`,
    title,
    address,
    schedule,
    photos,
    index,
  };
};

/**
 * RestaurantsPage — index page for the restaurant network from OneEntry `restaurants` + child-pages.
 *
 * @returns Promise resolving to JSX of the restaurants index (parent page intro + grid of restaurant cards).
 */
const RestaurantsPage = async (): Promise<JSX.Element> => {
  const [parentRes, childrenRes] = await Promise.all([
    getPageByUrl(PAGES.restaurants),
    getChildPagesByParentUrl(PAGES.restaurants),
  ]);

  if (parentRes.isError || !parentRes.page) {
    return notFound();
  }

  const parent = parentRes.page;
  const title =
    parent.localizeInfos?.title ??
    (await t('restaurants_title_fallback', 'Welcome to our restaurant chain'));
  const descriptionBlock = unwrapRichText(parent.attributeValues?.description?.value);
  const descriptionHtml = descriptionBlock?.htmlValue ?? '';
  const descriptionPlain = descriptionBlock?.plainValue ?? '';

  const visiblePages = (childrenRes.pages ?? [])
    .filter(p => p.isVisible !== false)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const cards: RestaurantCard[] = visiblePages.map((p, idx) => buildCard(p, idx + 1));
  // One blur map keyed by `downloadLink` is shared across every card's slider.
  const blurMap = await getPhotosBlurMap(cards.flatMap(c => c.photos));
  const moreLabel = await t('restaurant_more_button', 'More about restaurant');

  return (
    <section className="section_layout pt-0">
      <h1 className="text-2xl font-bold tracking-fine text-brand uppercase md:text-3xl">{title}</h1>
      {descriptionHtml ? (
        <div
          className="mt-3.75 text-base text-paper/90"
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      ) : descriptionPlain ? (
        <p className="mt-3.75 text-base text-paper/90">{descriptionPlain}</p>
      ) : null}

      {cards.length === 0 ? (
        <p className="mt-10 text-paper/70">
          No restaurants configured yet. Add child pages under{' '}
          <code className="text-brand">restaurants</code> in the OneEntry admin.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-7.5 md:grid-cols-2">
          {cards.map(card => (
            <RestaurantCardView key={card.id} card={card} blurMap={blurMap} moreLabel={moreLabel} />
          ))}
        </div>
      )}
    </section>
  );
};

/**
 * RestaurantCardView — single card on the restaurants index (photos + meta + CTA link).
 *
 * @param   {object}                  props         - Component props.
 * @param   {RestaurantCard}          props.card    - View-model produced by {@link buildCard}.
 * @param   {Record<string, string>}  [props.blurMap] - `{ [downloadLink]: base64DataURI }` LQIP placeholders (see `getPhotosBlurMap`).
 * @returns JSX of one restaurant card.
 */
const RestaurantCardView = ({
  card,
  blurMap,
  moreLabel,
}: {
  card: RestaurantCard;
  blurMap?: Record<string, string>;
  moreLabel: string;
}): JSX.Element => {
  return (
    <div className="flex flex-col items-stretch gap-5">
      <RestaurantPhotoSlider
        photos={card.photos}
        alt={card.title}
        blurMap={blurMap}
        frameClassName="aspect-[620/440]"
        sizes="(min-width: 1280px) 640px, (min-width: 768px) 50vw, 100vw"
        priority={false}
      />
      <div className="flex items-center justify-center gap-5">
        <div className="flex size-9.5 shrink-0 items-center justify-center rounded-full border border-brand text-base text-brand">
          {card.index}
        </div>
        <div className="flex flex-col text-center">
          {card.address ? (
            <p className="text-base text-brand">{card.address}</p>
          ) : (
            <p className="text-base text-brand">{card.title}</p>
          )}
          {card.schedule ? <p className="text-base text-brand">{card.schedule}</p> : null}
        </div>
      </div>
      <Link href={card.href} className="cart_btn text-uppercase">
        {moreLabel}
      </Link>
    </div>
  );
};

export default RestaurantsPage;

/**
 * generateMetadata — restaurants index metadata from the OneEntry `restaurants` page title.
 *
 * @returns Promise resolving to the page metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getPageByUrl(PAGES.restaurants);
  const title = page?.localizeInfos?.title ?? 'Restaurants';
  return {
    title,
    description: title,
    openGraph: { type: 'website' },
  };
}
