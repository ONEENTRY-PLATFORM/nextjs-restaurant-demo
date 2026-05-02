'use client';

import { gsap } from 'gsap';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { JSX } from 'react';
import { useEffect, useRef } from 'react';

import type { BlogBanner } from '@/app/api';

import PromoBannerAnimations from './animations/PromoBannerAnimations';

const EXIT_DURATION = 0.4;

/**
 * Промо-сайдбар только для десктопа, показывается рядом с корзиной (порт правой
 * колонки `static-html/pk_cart.html`). Управляется дочерними страницами
 * `blog` из OneEntry — использует `attributeValues.banner` (mobile/portrait вариант),
 * что совпадает с формой стаканной колонки в верстке. Широкий вариант `bg_image`
 * зарезервирован только для hero на главной.
 *
 * При клике по любой внутренней ссылке внутри документа сайдбар перехватывает
 * навигацию, проигрывает экзит-анимацию баннеров и только затем выполняет
 * `router.push` — это симметрично enter-анимации, которая запускается при
 * монтировании.
 *
 * @param   {object}        props         - Пропсы сайдбара.
 * @param   {BlogBanner[]}  props.banners - Список баннеров из CMS.
 * @returns {JSX.Element}                 JSX сайдбара.
 */
const CartPromoSidebar = ({
  banners,
}: {
  banners: BlogBanner[];
}): JSX.Element | null => {
  const items = banners.filter((b) => b.mobileImage);
  const asideRef = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isExitingRef = useRef(false);

  useEffect(() => {
    if (items.length === 0) return;

    const onDocumentClick = (event: MouseEvent) => {
      if (isExitingRef.current) return;
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor || anchor.getAttribute('target') === '_blank') return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;

      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === pathname) return;

      const aside = asideRef.current;
      if (!aside) return;
      const banners = aside.querySelectorAll<HTMLElement>(
        '[data-promo-banner]',
      );
      if (banners.length === 0) return;

      event.preventDefault();
      event.stopPropagation();
      isExitingRef.current = true;

      gsap.to(Array.from(banners), {
        opacity: 0,
        yPercent: 100,
        duration: EXIT_DURATION,
        stagger: 0.05,
        onComplete: () => {
          router.push(url.pathname + url.search + url.hash);
        },
      });
    };

    document.addEventListener('click', onDocumentClick, true);
    return () => {
      document.removeEventListener('click', onDocumentClick, true);
    };
  }, [items.length, pathname, router]);

  if (items.length === 0) return null;

  return (
    <aside ref={asideRef} className="hidden w-1/2 flex-col gap-10 md:flex">
      {items.map((b, i) => (
        <PromoBannerAnimations key={b.id} index={i}>
          <Link
            href={b.pageUrl ? `/promo/${b.pageUrl}` : '#'}
            title={b.title}
            className="block overflow-hidden rounded-[10px] transition-transform duration-500 hover:scale-[1.02]"
          >
            <Image
              src={b.mobileImage as string}
              alt={b.title}
              width={615}
              height={278}
              className="h-auto w-full"
            />
          </Link>
        </PromoBannerAnimations>
      ))}
    </aside>
  );
};

export default CartPromoSidebar;
