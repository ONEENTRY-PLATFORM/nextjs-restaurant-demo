'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { useSearchParams } from 'next/navigation';
import { useTransitionState } from 'next-transition-router';
import type { JSX, ReactElement, ReactNode } from 'react';
import { cloneElement, isValidElement, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Strips the `page` param from a search-string so pagination changes don't trigger the
 * filter-swap fade. Pagination keeps the same `swapKey` and only appends new cards.
 *
 * @param   {URLSearchParams} params - Source params.
 * @returns Search-string without the `page` key.
 */
const buildSwapKey = (params: URLSearchParams): string => {
  const next = new URLSearchParams(params.toString());
  next.delete('page');
  return next.toString();
};

/**
 * CardsGridAnimations — wraps the products grid with two animations:
 *
 * 1. Page-leave (`next-transition-router` stage transition): fades visible `.in-view` cards out,
 *    then the wrapper, while routing to another page.
 * 2. Filter-swap (search params change inside the same page): fades the current cards out, then
 *    re-mounts the subtree under a new key so each `CardAnimations` instance replays its per-card
 *    stagger reveal on the new product list.
 *
 * The displayed subtree is held in state and lags one beat behind the latest server payload.
 * Without this hold the parent server component re-renders with new products as soon as the URL
 * updates, React reconciles cards by `product.id`, retained instances stay visible (no animation),
 * and removed ones disappear instantly — what looked like a silent swap to the user.
 *
 * @param   {object}    props           - Component props.
 * @param   {ReactNode} props.children  - Grid content (typically the products grid markup).
 * @param   {string}    props.className - Class merged onto the wrapping `<div>`.
 * @returns JSX wrapper that orchestrates the page-leave / filter-swap animations.
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
  const swapKey = useMemo(() => buildSwapKey(searchParams), [searchParams]);

  const latestChildrenRef = useRef<ReactNode>(children);
  useEffect(() => {
    latestChildrenRef.current = children;
  });

  const [displayed, setDisplayed] = useState<{ key: string; node: ReactNode }>(() => ({
    key: swapKey,
    node: children,
  }));

  // During a filter swap (`swapKey` changed) we freeze the old subtree as `displayed.node` so the
  // fade-out animation has stable DOM to work on, then commit the latest children via
  // `setDisplayed` in the gsap `onComplete`. Outside of a swap (initial render / pagination), the
  // latest `children` are passed through directly under the same React key so existing
  // `ProductCard`s are reconciled by `product.id` and only newly appended cards run their reveal.
  const isMidSwap = swapKey !== displayed.key;
  const nodeToRender = isMidSwap ? displayed.node : children;

  useGSAP(() => {
    if (swapKey === displayed.key) return;

    const el = ref.current;
    const cards = el?.querySelectorAll<HTMLElement>('.menu_item');
    if (!cards || cards.length === 0) {
      setDisplayed({ key: swapKey, node: latestChildrenRef.current });
      return;
    }

    const tl = gsap.to(cards, {
      autoAlpha: 0,
      y: -8,
      duration: 0.25,
      ease: 'power2.in',
      stagger: { each: 0.02, from: 'end' },
      onComplete: () => {
        setDisplayed({ key: swapKey, node: latestChildrenRef.current });
      },
    });

    return () => {
      tl.kill();
    };
  }, [swapKey, displayed.key]);

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

  const renderedChild = isValidElement(nodeToRender)
    ? cloneElement(nodeToRender as ReactElement, { key: displayed.key })
    : nodeToRender;

  return (
    <div ref={ref} className={className}>
      {renderedChild}
    </div>
  );
};

export default CardsGridAnimations;
