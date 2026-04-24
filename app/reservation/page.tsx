import type { Metadata } from 'next';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { JSX } from 'react';

import {
  getChildPagesByParentUrl,
  getFormByMarker,
  getImageUrl,
  getPageByUrl,
} from '@/app/api';
import { getDictionary } from '@/app/api/utils/dictionaries';
import ReservationForm from '@/components/reservation/ReservationForm';
import type { RestaurantOption } from '@/components/reservation/RestaurantSelect';

export const dynamic = 'force-dynamic';

/**
 * Reservation page — renders the hero content from CMS page `reservation`
 * plus a dynamic {@link ReservationForm} fetched from `reservation` form marker.
 * @returns {Promise<JSX.Element>} Reservation page JSX.
 */
const ReservationPage = async (): Promise<JSX.Element> => {
  const [pageRes, formRes, restaurantsParentRes, restaurantsRes, dict] =
    await Promise.all([
      getPageByUrl('bookings'),
      getFormByMarker('booking_order'),
      getPageByUrl('restaurants'),
      getChildPagesByParentUrl('restaurants'),
      getDictionary(),
    ]);

  const restaurants: RestaurantOption[] = (restaurantsRes.pages ?? []).map(
    (p: IPagesEntity) => ({
      value: p.pageUrl ?? String(p.id),
      label:
        ((p.attributeValues?.address?.value as string | undefined) ??
          (p.attributeValues?.restaurant_address?.value as
            | string
            | undefined) ??
          p.localizeInfos?.title) ||
        'Restaurant',
    }),
  );

  // Use parent `restaurants` page rich content (title/description/photos) as hero
  const parent = restaurantsParentRes.page;
  const photos =
    (parent?.attributeValues?.photos?.value as
      | Array<{ downloadLink?: string }>
      | undefined) ?? [];
  const heroImage =
    photos[0]?.downloadLink ??
    getImageUrl(
      pageRes.page?.attributeValues?.reservation_hero_image?.value as
        | { downloadLink?: string }
        | Array<{ downloadLink?: string }>
        | null
        | undefined,
    );
  const title =
    (parent?.attributeValues?.title?.value as string | undefined) ??
    (pageRes.page?.attributeValues?.reservation_title?.value as
      | string
      | undefined) ??
    pageRes.page?.localizeInfos?.title ??
    'Book a table';
  const descriptionRaw =
    (parent?.attributeValues?.description?.value as
      | Array<{ htmlValue?: string; plainValue?: string }>
      | undefined) ??
    (pageRes.page?.attributeValues?.reservation_description?.value as
      | Array<{ htmlValue?: string; plainValue?: string }>
      | undefined);
  const descriptionHtml = descriptionRaw?.[0]?.htmlValue ?? '';

  return (
    <section
      className="min-h-screen bg-cover bg-no-repeat"
      style={{ backgroundImage: "url('/images/picture/bg_cart.png')" }}
    >
      <div className="mx-auto w-full max-w-88 md:max-w-175 lg:max-w-250 xl:max-w-323 px-4 py-10">
        <div className="mb-8 overflow-hidden rounded-[20px] bg-ink/60">
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImage}
              alt={title}
              className="h-auto w-full object-cover"
            />
          ) : null}
          <div className="p-6 md:p-10">
            <h1 className="mb-5 font-bold text-[24px] md:text-[32px] uppercase tracking-[0.02em] text-brand">
              {title}
            </h1>
            {descriptionHtml ? (
              <div
                className="mb-6 text-base text-paper/90"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            ) : null}
          </div>
        </div>

        {formRes.isError || !formRes.form ? (
          <div className="rounded-xl bg-ink/60 p-6 text-center text-paper/80">
            Reservation form is not available. Please configure form{' '}
            <code className="text-brand">reservation</code> in OneEntry admin.
          </div>
        ) : (
          <ReservationForm
            form={formRes.form}
            dict={dict}
            restaurants={restaurants}
          />
        )}
      </div>
    </section>
  );
};

export default ReservationPage;

/**
 * Generate page metadata for reservation route.
 * @returns {Promise<Metadata>} Page metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getPageByUrl('bookings');
  const title =
    (page?.attributeValues?.reservation_title?.value as string | undefined) ??
    page?.localizeInfos?.title ??
    'Book a table';
  return {
    title,
    description: 'Book a table at our restaurant',
  };
}
