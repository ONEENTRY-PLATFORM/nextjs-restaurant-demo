'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import Image from 'next/image';
import Link from 'next/link';
import { useTransitionState } from 'next-transition-router';
import type { JSX } from 'react';
import { useRef, useState } from 'react';

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
 * Exit-анимация баннеров — через стандартный `stage='leaving'` от
 * `next-transition-router`. Раньше сайдбар сам перехватывал клики по ссылкам
 * через document-listener в capture-фазе и звал `router.push` после собственной
 * анимации, но это обходило `auto`-интерсептор `TransitionRouter`: глобальный
 * `stage` оставался `'none'`, и leave-хуки соседних компонентов
 * (`CartAnimations` / `StepOrder`) не срабатывали — анимировались только
 * баннеры. Сейчас все leave-анимации работают параллельно по одному стейджу.
 *
 * @param   {object}        props         - Пропсы сайдбара.
 * @param   {BlogBanner[]}  props.banners - Список баннеров из CMS.
 * @returns {JSX.Element}                 JSX сайдбара.
 */
const CartPromoSidebar = ({ banners }: { banners: BlogBanner[] }): JSX.Element | null => {
  const items = banners.filter(b => b.mobileImage);
  const asideRef = useRef<HTMLElement | null>(null);
  const { stage } = useTransitionState();
  const [prevStage, setPrevStage] = useState<string>('');

  useGSAP(() => {
    const tl = gsap.timeline({ paused: true });

    if (stage === 'leaving' && prevStage === 'none' && asideRef.current) {
      const targets = asideRef.current.querySelectorAll('[data-promo-banner]');
      if (targets.length > 0) {
        tl.to(targets, {
          opacity: 0,
          yPercent: 100,
          duration: EXIT_DURATION,
          stagger: 0.05,
        });
        tl.play();
      }
    }

    setPrevStage(stage);

    return () => {
      tl.kill();
    };
  }, [stage]);

  if (items.length === 0) return null;

  return (
    <aside ref={asideRef} className="hidden w-1/2 flex-col gap-10 md:flex">
      {items.map((b, i) => (
        <PromoBannerAnimations key={b.id} index={i}>
          <Link
            href={b.pageUrl ? `/promo/${b.pageUrl}` : '#'}
            title={b.title}
            className="block overflow-hidden transition-transform duration-500 hover:scale-[1.02]"
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
