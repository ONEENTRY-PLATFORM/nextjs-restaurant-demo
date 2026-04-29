import Link from 'next/link';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { JSX } from 'react';

import { getImageUrl } from '@/app/api';

/**
 * Single promo card — driven by OneEntry `blog` child page attributes
 * (set: `blog_page`).
 *
 * Real attributes from CMS:
 *   - `banner`      (image) — used as the card preview;
 *   - `bg_image`    (image) — desktop fallback if `banner` is empty;
 *   - `description` (text)  — markdown/plain/html, shown as subtitle;
 *   - `action_type` (list)  — `[{ title, value }]`, first option becomes
 *                             the CTA label; falls back to "Learn more".
 *
 * Title comes from `localizeInfos.title` (no `title` attribute exists in
 * the admin's `blog_page` set — verified via `inspect-api`).
 * @param   {object}        props      - Component properties.
 * @param   {IPagesEntity}  props.page - Promo page entity from OneEntry CMS.
 * @returns {JSX.Element}              Promo card JSX.
 */
const PromoCard = ({ page }: { page: IPagesEntity }): JSX.Element => {
  const attrs = page.attributeValues ?? {};
  type ImageValue =
    | { downloadLink?: string }
    | Array<{ downloadLink?: string }>
    | null
    | undefined;

  const image =
    getImageUrl(attrs.banner?.value as ImageValue) ||
    getImageUrl(attrs.bg_image?.value as ImageValue);

  const title = page.localizeInfos?.title ?? '';

  const descriptionValue = attrs.description?.value as
    | Array<{ plainValue?: string; htmlValue?: string; mdValue?: string }>
    | undefined;
  const subtitleText = descriptionValue?.[0]?.plainValue ?? '';

  const actionType = attrs.action_type?.value as
    | Array<{ title?: string }>
    | undefined;
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
        <h3 className="font-bold text-[20px] uppercase tracking-[0.02em] text-brand">
          {title}
        </h3>
        {subtitleText ? (
          <p className="text-sm text-paper/90 line-clamp-2">{subtitleText}</p>
        ) : null}
        <span className="mt-2 inline-flex w-fit rounded-[10px] bg-custom-gradient px-4 py-1.5 text-xs font-bold uppercase text-white">
          {cta}
        </span>
      </div>
    </Link>
  );
};

export default PromoCard;
