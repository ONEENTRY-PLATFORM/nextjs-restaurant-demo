import Link from 'next/link';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { JSX } from 'react';

import { getImageUrl } from '@/app/api';

/**
 * Одиночная промо-карточка — питается атрибутами дочерней страницы `blog`
 * OneEntry (set: `blog_page`).
 *
 * Реальные атрибуты из CMS:
 *   - `banner`      (image) — используется как превью карточки;
 *   - `bg_image`    (image) — десктопный fallback, если `banner` пустой;
 *   - `description` (text)  — markdown/plain/html, отображается как подзаголовок;
 *   - `action_type` (list)  — `[{ title, value }]`, первая опция становится
 *                             подписью CTA; fallback — "Learn more".
 *
 * Заголовок берётся из `localizeInfos.title` (атрибута `title` в админском
 * наборе `blog_page` нет — проверено через `inspect-api`).
 * @param   {object}        props      - Свойства компонента.
 * @param   {IPagesEntity}  props.page - Сущность промо-страницы из OneEntry CMS.
 * @returns {JSX.Element}              JSX промо-карточки.
 */
const PromoCard = ({ page }: { page: IPagesEntity }): JSX.Element => {
  const attrs = page.attributeValues ?? {};
  type ImageValue = { downloadLink?: string } | Array<{ downloadLink?: string }> | null | undefined;

  const image =
    getImageUrl(attrs.banner?.value as ImageValue) ||
    getImageUrl(attrs.bg_image?.value as ImageValue);

  const title = page.localizeInfos?.title ?? '';

  const descriptionValue = attrs.description?.value as
    | Array<{ plainValue?: string; htmlValue?: string; mdValue?: string }>
    | undefined;
  const subtitleText = descriptionValue?.[0]?.plainValue ?? '';

  const actionType = attrs.action_type?.value as Array<{ title?: string }> | undefined;
  const cta = actionType?.[0]?.title ?? 'Learn more';

  return (
    <Link
      href={'/promo/' + page.pageUrl}
      title={title}
      className="group relative block overflow-hidden rounded-[10px] bg-ink/60 transition-transform duration-500 hover:scale-[1.02]"
      style={
        image
          ? {
              backgroundImage: `url('${image}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      <div className="flex min-h-48 flex-col justify-end gap-2 bg-linear-to-t from-black/70 via-black/20 to-transparent p-5">
        <h3 className="font-bold text-[20px] uppercase tracking-[0.02em] text-brand">{title}</h3>
        {subtitleText ? <p className="text-sm text-paper/90 line-clamp-2">{subtitleText}</p> : null}
        <span className="mt-2 inline-flex w-fit rounded-[10px] bg-custom-gradient px-4 py-1.5 text-xs font-bold uppercase text-white">
          {cta}
        </span>
      </div>
    </Link>
  );
};

export default PromoCard;
