import Link from 'next/link';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { JSX } from 'react';

import { getImageUrl } from '@/app/api';

/**
 * PromoCard — single promo card from a OneEntry `blog` child page (set: `blog_page`).
 *
 * Attributes: `banner`/`bg_image` (image), `description` (text), `action_type` (list, CTA).
 *
 * @param   {object}        props      - Component props.
 * @param   {IPagesEntity}  props.page - Promo page entity from OneEntry.
 * @returns JSX of the promo card.
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
      className="group relative block overflow-hidden rounded-panel bg-ink/60 transition-transform duration-500 hover:scale-[1.02]"
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
        <h3 className="font-bold text-xl uppercase tracking-fine text-brand">{title}</h3>
        {subtitleText ? <p className="text-sm text-paper/90 line-clamp-2">{subtitleText}</p> : null}
        <span className="mt-2 inline-flex w-fit rounded-panel bg-custom-gradient px-4 py-1.5 text-xs font-bold uppercase text-white">
          {cta}
        </span>
      </div>
    </Link>
  );
};

export default PromoCard;
