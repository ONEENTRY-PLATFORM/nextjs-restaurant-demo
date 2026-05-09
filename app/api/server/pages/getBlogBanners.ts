import { cache } from 'react';

import { getImageUrl } from '@/app/api/api/api';

import { getChildPagesByParentUrl } from './getChildPagesByParentUrl';

/**
 * BlogBanner — нормализованный промо-баннер (HomePromo, CartPromoSidebar, промо-сайдбар заказов).
 *
 * `desktopImage` = `attributeValues.bg_image` (2-колоночные сайдбары и hero-фон);
 * `mobileImage`  = `attributeValues.banner` (узкие горизонтальные карусели);
 * `pageUrl`      ссылается на `/promo/<pageUrl>`.
 */
export type BlogBanner = {
  id: number;
  pageUrl: string;
  title: string;
  desktopImage: string | null;
  mobileImage: string | null;
};

/**
 * getBlogBanners — дочерние страницы `blog` как промо-баннеры с десктоп/мобильным изображениями.
 *
 * Страницы без изображений тоже включаются — вызывающий решает, какой вариант рендерить.
 * Сортировка по `position` руками: SDK отдаёт детей в порядке `id` (создания), а не позиции —
 * иначе hero и соседние карточки промо рендерятся в случайном порядке.
 * @returns {Promise<BlogBanner[]>} Список баннеров (пустой при ошибке CMS).
 */
export const getBlogBanners = cache(async (): Promise<BlogBanner[]> => {
  const { isError, pages } = await getChildPagesByParentUrl('blog');
  if (isError || !pages) return [];

  type ImageValue = { downloadLink?: string } | Array<{ downloadLink?: string }> | null | undefined;

  const sorted = [...pages].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return sorted.map(p => {
    const attrs = p.attributeValues ?? {};
    const desktopImage = getImageUrl(attrs.bg_image?.value as ImageValue) || null;
    const mobileImage = getImageUrl(attrs.banner?.value as ImageValue) || null;
    return {
      id: p.id,
      pageUrl: p.pageUrl ?? '',
      title: p.localizeInfos?.title ?? '',
      desktopImage,
      mobileImage,
    };
  });
});
