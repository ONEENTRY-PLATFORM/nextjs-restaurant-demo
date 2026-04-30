import type { Metadata } from 'next';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { JSX } from 'react';

import {
  getChildPagesByParentUrl,
  getFormByMarker,
  getPageByUrl,
} from '@/app/api';
import { getDictionary } from '@/app/dictionaries';
import ReservationForm from '@/components/reservation/ReservationForm';
import type { RestaurantOption } from '@/components/reservation/RestaurantSelect';

export const dynamic = 'force-dynamic';

/**
 * Страница бронирования — рендерит hero-контент со страницы CMS `reservation`
 * плюс динамическую {@link ReservationForm}, подгруженную по маркеру формы `reservation`.
 * @returns {Promise<JSX.Element>} JSX страницы бронирования.
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

  // Дочерние страницы ресторанов внутри `restaurants`: у каждой есть `address` (string) +
  // `localizeInfos.title`. Проверено через inspect-api — атрибута `restaurant_address`
  // нет, поэтому подпись опции откатывается на `address`, затем на `title`.
  const restaurants: RestaurantOption[] = (restaurantsRes.pages ?? []).map(
    (p: IPagesEntity) => ({
      value: p.pageUrl ?? String(p.id),
      label:
        ((p.attributeValues?.address?.value as string | undefined) ||
          p.localizeInfos?.title) ??
        'Restaurant',
    }),
  );

  // Hero берётся с родительской страницы `restaurants` (`photos` groupOfImages,
  // `description` text). У страницы `bookings` есть только `menu_icon`, выделенных
  // атрибутов reservation_* нет — проверено через inspect-api.
  const parent = restaurantsParentRes.page;
  const photos =
    (parent?.attributeValues?.photos?.value as
      | Array<{ downloadLink?: string }>
      | undefined) ?? [];
  const heroImage = photos[0]?.downloadLink;
  const title =
    parent?.localizeInfos?.title ??
    pageRes.page?.localizeInfos?.title ??
    'Book a table';
  const descriptionRaw = parent?.attributeValues?.description?.value as
    | Array<{ htmlValue?: string; plainValue?: string }>
    | undefined;
  const descriptionHtml = descriptionRaw?.[0]?.htmlValue ?? '';

  return (
    <section className="min-h-screen bg-[url('/images/picture/bg_cart.png')] bg-cover bg-no-repeat md:bg-none">
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
 * Генерирует метаданные страницы для маршрута бронирования.
 * @returns {Promise<Metadata>} Метаданные страницы.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getPageByUrl('bookings');
  const title = page?.localizeInfos?.title ?? 'Book a table';
  return {
    title,
    description: 'Book a table at our restaurant',
  };
}
