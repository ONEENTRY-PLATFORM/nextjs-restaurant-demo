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
 * CartPromoSidebar — desktop sidebar next to the cart, sourced from OneEntry `blog` pages.
 *
 * Uses `attributeValues.banner` (portrait); exit animation triggers on `stage='leaving'` — otherwise
 * the neighbors' leave does not fire.
 *
 * @param   {object}        props         - Component props.
 * @param   {BlogBanner[]}  props.banners - List of banners from the CMS.
 * @returns {JSX.Element | null}            JSX of the desktop promo sidebar, or `null` when no banner has a mobile image.
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
