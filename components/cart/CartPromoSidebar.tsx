'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import Image from 'next/image';
import Link from 'next/link';
import { useTransitionState } from 'next-transition-router';
import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { BlogBanner } from '@/app/api';

import PromoBannerAnimations from './animations/PromoBannerAnimations';

const EXIT_DURATION = 0.4;

/**
 * PromoBanner — single promo banner link; a pulsing skeleton fills the reserved box until the image finishes loading.
 *
 * The skeleton sits behind the (opaque) banner image, so a cached image that is already `complete` on mount hides it immediately via the effect, and a streaming image reveals it as it paints.
 *
 * @param   {object}      props        - Component props.
 * @param   {BlogBanner}  props.banner - Banner entity from the CMS.
 * @returns JSX of the banner link with its loading skeleton.
 */
const PromoBanner = ({ banner }: { banner: BlogBanner }): JSX.Element => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <Link
      href={banner.pageUrl ? `/promo/${banner.pageUrl}` : '#'}
      title={banner.title}
      className="relative block overflow-hidden transition-transform duration-500 hover:scale-[1.02]"
    >
      {!loaded && (
        <span aria-hidden="true" className="absolute inset-0 z-0 animate-pulse bg-paper/15" />
      )}
      <Image
        ref={imgRef}
        src={banner.mobileImage as string}
        alt={banner.title}
        width={615}
        height={278}
        onLoad={() => setLoaded(true)}
        className="relative z-10 h-auto w-full"
      />
    </Link>
  );
};

/**
 * CartPromoSidebar — desktop sidebar next to the cart, sourced from OneEntry `blog` pages.
 *
 * @param   {object}        props         - Component props.
 * @param   {BlogBanner[]}  props.banners - List of banners from the CMS.
 * @returns JSX of the desktop promo sidebar, or `null` when no banner has a mobile image.
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
          <PromoBanner banner={b} />
        </PromoBannerAnimations>
      ))}
    </aside>
  );
};

export default CartPromoSidebar;
