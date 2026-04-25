import Link from 'next/link';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { JSX } from 'react';

import { getImageUrl } from '@/app/api';

/**
 * Single promo card — renders the `promo_image`, `promo_title`, `promo_subtitle`
 * and a CTA linking to `/promo/[pageUrl]`.
 * @param   {object}        props      - Component properties.
 * @param   {IPagesEntity}  props.page - Promo page entity from OneEntry CMS.
 * @returns {JSX.Element}              Promo card JSX.
 */
const PromoCard = ({ page }: { page: IPagesEntity }): JSX.Element => {
  const attrs = page.attributeValues ?? {};
  // admin `blog_page` set: banner/title/description/action_type
  const imageValue = attrs.banner?.value ?? attrs.promo_image?.value;
  const image = getImageUrl(
    imageValue as
      | { downloadLink?: string }
      | Array<{ downloadLink?: string }>
      | null
      | undefined,
  );
  const title =
    (attrs.title?.value as string | undefined) ??
    (attrs.promo_title?.value as string | undefined) ??
    page.localizeInfos?.title ??
    '';
  const subtitle =
    (attrs.description?.value as Array<{ plainValue?: string }> | undefined) ??
    (attrs.promo_subtitle?.value as
      | Array<{ plainValue?: string }>
      | string
      | undefined) ??
    '';
  const subtitleText = Array.isArray(subtitle)
    ? (subtitle[0]?.plainValue ?? '')
    : subtitle;
  const actionType = attrs.action_type?.value as
    | Array<{ title?: string }>
    | undefined;
  const cta =
    actionType?.[0]?.title ??
    (attrs.promo_cta?.value as string | undefined) ??
    'Learn more';

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
