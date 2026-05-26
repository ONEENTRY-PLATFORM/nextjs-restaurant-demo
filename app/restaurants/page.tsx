import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { JSX } from 'react';

import { getChildPagesByParentUrl, getPageByUrl } from '@/app/api';
import { PAGES } from '@/app/utils/constants';
import RestaurantPhotoSlider from '@/components/restaurants/RestaurantPhotoSlider';

export const dynamic = 'force-dynamic';

type RestaurantPhoto = { downloadLink?: string };
type ScheduleInterval = { from?: string; to?: string };

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
 * formatSchedule — renders the OneEntry `timeInterval` value as `from - to`.
 *
 * @param   {unknown} raw - Raw attribute value (string, object, or array of intervals).
 * @returns Formatted `from - to` string, or empty when no interval is present.
 */
const formatSchedule = (raw: unknown): string => {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  // `timeInterval` comes as an object or array - take the first interval.
  const arr = Array.isArray(raw) ? (raw as ScheduleInterval[]) : null;
  const first = arr ? arr[0] : (raw as ScheduleInterval);
  if (!first || (!first.from && !first.to)) return '';
  return `${first.from ?? ''} - ${first.to ?? ''}`;
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
  const title = parent.localizeInfos?.title ?? 'Welcome to our restaurant chain';
  const descriptionRaw = parent.attributeValues?.description?.value as
    | Array<{ htmlValue?: string; plainValue?: string }>
    | undefined;
  const descriptionHtml = descriptionRaw?.[0]?.htmlValue ?? '';
  const descriptionPlain = descriptionRaw?.[0]?.plainValue ?? '';

  const visiblePages = (childrenRes.pages ?? [])
    .filter(p => p.isVisible !== false)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const cards: RestaurantCard[] = visiblePages.map((p, idx) => buildCard(p, idx + 1));

  return (
    <section className="section_layout pt-0">
      <h1 className="font-bold text-2xl md:text-3xl uppercase tracking-fine text-brand">{title}</h1>
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
            <RestaurantCardView key={card.id} card={card} />
          ))}
        </div>
      )}
    </section>
  );
};

/**
 * RestaurantCardView — single card on the restaurants index (photos + meta + CTA link).
 *
 * @param   {object}          props      - Component props.
 * @param   {RestaurantCard}  props.card - View-model produced by {@link buildCard}.
 * @returns JSX of one restaurant card.
 */
const RestaurantCardView = ({ card }: { card: RestaurantCard }): JSX.Element => {
  return (
    <div className="flex flex-col items-stretch gap-5">
      <RestaurantPhotoSlider
        photos={card.photos}
        alt={card.title}
        frameClassName="aspect-[620/440]"
        sizes="(min-width: 1280px) 640px, (min-width: 768px) 50vw, 100vw"
        priority={false}
      />
      <div className="flex items-center justify-center gap-5">
        <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-full border border-brand text-base text-brand">
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
        More about restaurant
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
