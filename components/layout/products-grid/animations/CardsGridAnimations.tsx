'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { useSearchParams } from 'next/navigation';
import { useTransitionState } from 'next-transition-router';
import type { JSX, ReactElement, ReactNode } from 'react';
import { cloneElement, isValidElement, useEffect, useRef, useState } from 'react';

/**
 * CardsGridAnimations — wraps the products grid with two animations:
 * 1. Page-leave (`next-transition-router` stage transition): fades visible
 *    `.in-view` cards out, then the wrapper, while routing to another page.
 * 2. Filter-swap (search params change inside the same page): fades the
 *    current cards out, then re-mounts the subtree under a new key so each
 *    `CardAnimations` instance replays its per-card stagger reveal on the
 *    new product list.
 *
 * The displayed subtree is held in state and lags one beat behind the latest
 * server payload. Without this hold the parent server component re-renders
 * with new products as soon as the URL updates, React reconciles cards by
 * `product.id`, retained instances stay visible (no animation) and removed
 * ones disappear instantly — what looked like a silent swap to the user.
 */
const CardsGridAnimations = ({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}): JSX.Element => {
  const { stage } = useTransitionState();
  const [prevStage, setPrevStage] = useState('');
  const ref = useRef<HTMLDivElement | null>(null);

  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();

  // Mirror the latest children prop into a ref so the swap callback always
  // picks up the freshest server payload, even if it arrived after the exit
  // animation started.
  const latestChildrenRef = useRef<ReactNode>(children);
  useEffect(() => {
    latestChildrenRef.current = children;
  });

  const [displayed, setDisplayed] = useState<{ key: string; node: ReactNode }>(() => ({
    key: paramsKey,
    node: children,
  }));

  useGSAP(() => {
    if (paramsKey === displayed.key) return;

    const el = ref.current;
    const cards = el?.querySelectorAll<HTMLElement>('.menu_item');
    if (!cards || cards.length === 0) {
      setDisplayed({ key: paramsKey, node: latestChildrenRef.current });
      return;
    }

    const tl = gsap.to(cards, {
      autoAlpha: 0,
      y: -8,
      duration: 0.25,
      ease: 'power2.in',
      stagger: { each: 0.02, from: 'end' },
      onComplete: () => {
        setDisplayed({ key: paramsKey, node: latestChildrenRef.current });
      },
    });

    return () => {
      tl.kill();
    };
  }, [paramsKey, displayed.key]);

  useGSAP(() => {
    const tl = gsap.timeline({
      paused: true,
    });

    if (stage === 'leaving' && prevStage === 'none') {
      const cards = ref.current && (ref.current as HTMLDivElement).querySelectorAll('.in-view');

      tl.to(cards, {
        autoAlpha: 0,
        scale: 0,
        duration: 0.45,
        stagger: { each: 0.05, from: 'end' },
      }).to(ref.current, {
        autoAlpha: 0,
        duration: 0.35,
      });
      tl.play();
    }

    setPrevStage(stage);

    return () => {
      tl.kill();
    };
  }, [stage]);

  const renderedChild = isValidElement(displayed.node)
    ? cloneElement(displayed.node as ReactElement, { key: displayed.key })
    : displayed.node;

  return (
    <div ref={ref} className={className}>
      {renderedChild}
    </div>
  );
};

export default CardsGridAnimations;
