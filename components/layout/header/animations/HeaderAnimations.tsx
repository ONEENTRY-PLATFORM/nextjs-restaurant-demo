'use client';

import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { markHeaderAnimationComplete } from '@/app/animations/headerAnimState';

/**
 * HeaderAnimations — initial-load stagger animation for header elements.
 *
 * @param   {object}    props          - Component props.
 * @param   {ReactNode} props.children - Header subtree containing the animated elements.
 * @returns JSX wrapper around the header subtree.
 */
const HeaderAnimations = ({ children }: { children: ReactNode }): JSX.Element => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;

    const q = (sel: string): Element[] => Array.from(root.querySelectorAll(sel));

    const logoParts = q(
      '.logo-top path, .logo-bottom path, .logo-text path, [data-header-anim="logo-mobile"]'
    );
    const slogan = q('[data-header-anim="slogan"]');
    const search = q('[data-header-anim="search"]');
    const topNavItems = q('[data-header-anim="top-nav"] > *:not([data-header-anim])');
    const initialTags = q('[data-header-anim="tag"]');
    const handledTags = new WeakSet<Element>();
    initialTags.forEach(el => handledTags.add(el));

    const ctx = gsap.context(() => {
      const preset = [...logoParts, ...slogan, ...search, ...topNavItems];
      gsap.set(preset, { autoAlpha: 0 });
      gsap.set([...slogan, ...search], { y: 20 });
      gsap.set(topNavItems, { y: -16 });

      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        onComplete: markHeaderAnimationComplete,
      });

      // 1. Logo — single fade.
      if (logoParts.length > 0) {
        tl.to(logoParts, { autoAlpha: 1, duration: 0.6 }, 0);
      }

      // 2. Slogan.
      if (slogan.length > 0) {
        tl.to(slogan, { autoAlpha: 1, y: 0, duration: 0.5 }, '>-0.2');
      }

      // 3. Search row.
      if (search.length > 0) {
        tl.to(search, { autoAlpha: 1, y: 0, duration: 0.45 }, '>-0.2');
      }

      // 4. Top-right nav icons.
      if (topNavItems.length > 0) {
        tl.to(topNavItems, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.06 }, '>-0.15');
      }

      // 5. Category tag chips
      if (initialTags.length > 0) {
        tl.fromTo(
          initialTags,
          { autoAlpha: 0, y: 20 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.35,
            stagger: 0.04,
            immediateRender: false,
          },
          '>-0.15'
        );
      }
    }, root);

    // CategoriesScroller sits inside <Suspense fallback={null}> (uses useSearchParams).
    // Under force-static SSR its <li data-header-anim="tag"> elements arrive only
    // after hydration, often AFTER this effect already ran — without a follow-up
    // reveal they stay stuck at the CSS pre-hide (opacity:0; visibility:hidden).
    let pending: Element[] = [];
    let raf = 0;
    const flush = (): void => {
      raf = 0;
      const batch = pending;
      pending = [];
      if (batch.length === 0) return;
      gsap.fromTo(
        batch,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' }
      );
    };
    const collect = (node: Node): void => {
      if (!(node instanceof Element)) return;
      if (node.matches('[data-header-anim="tag"]') && !handledTags.has(node)) {
        handledTags.add(node);
        pending.push(node);
      }
      node.querySelectorAll('[data-header-anim="tag"]').forEach(el => {
        if (handledTags.has(el)) return;
        handledTags.add(el);
        pending.push(el);
      });
    };
    const observer = new MutationObserver(mutations => {
      for (const m of mutations) m.addedNodes.forEach(collect);
      if (pending.length > 0 && raf === 0) raf = requestAnimationFrame(flush);
    });
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      observer.disconnect();
      ctx.revert();
    };
  }, []);

  return <div ref={ref}>{children}</div>;
};

export default HeaderAnimations;
