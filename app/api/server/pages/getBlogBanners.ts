import { getImageUrl } from '@/app/api/api/api';

import { getChildPagesByParentUrl } from './getChildPagesByParentUrl';

/**
 * Нормализованная форма промо-баннера, которую используют `HomePromo`
 * (мобильная карусель + десктопный hero), `CartPromoSidebar` и
 * промо-сайдбар на странице заказов.
 *
 * - `desktopImage` — `attributeValues.bg_image` (используется в 2-колоночных /
 *   сайдбар-контекстах и как широкий hero-фон);
 * - `mobileImage`  — `attributeValues.banner` (используется в узких
 *   горизонтально-прокручиваемых списках);
 * - `pageUrl`      — ссылается на `/promo/<pageUrl>`.
 */
export type BlogBanner = {
  id: number;
  pageUrl: string;
  title: string;
  desktopImage: string | null;
  mobileImage: string | null;
};

/**
 * Получает все дочерние страницы страницы `blog` в OneEntry и возвращает их как
 * промо-баннеры с URL-ами десктопного (`bg_image`) и мобильного (`banner`) изображений.
 *
 * Страницы без какого-либо из изображений всё равно включаются — вызывающая
 * сторона решает, какой вариант рендерить, и аккуратно фолбэчится, если нужный
 * URL отсутствует.
 * @returns {Promise<BlogBanner[]>} Список баннеров (пустой при ошибке CMS).
 */
export const getBlogBanners = async (): Promise<BlogBanner[]> => {
  const { isError, pages } = await getChildPagesByParentUrl('blog');
  if (isError || !pages) return [];

  type ImageValue =
    | { downloadLink?: string }
    | Array<{ downloadLink?: string }>
    | null
    | undefined;

  return pages.map((p) => {
    const attrs = p.attributeValues ?? {};
    const desktopImage =
      getImageUrl(attrs.bg_image?.value as ImageValue) || null;
    const mobileImage = getImageUrl(attrs.banner?.value as ImageValue) || null;
    return {
      id: p.id,
      pageUrl: p.pageUrl ?? '',
      title: p.localizeInfos?.title ?? '',
      desktopImage,
      mobileImage,
    };
  });
};
