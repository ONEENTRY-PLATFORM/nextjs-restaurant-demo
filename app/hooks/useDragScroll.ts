'use client';

import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';

/**
 * useDragScroll — wires up mouse drag-to-scroll behavior for a horizontally
 * scrollable element — mirrors the behavior from `static-html/script.js` on
 * `#menuItems`. Touch scrolling works natively; no handlers needed for it.
 *
 * Usage:
 * ```tsx
 * const ref = useDragScroll<HTMLUListElement>();
 * return <ul ref={ref} className="overflow-x-auto">...</ul>;
 * ```
 *
 * @returns Ref to attach to the scrollable element (mouse handlers are wired on mount).
 */
export const useDragScroll = <T extends HTMLElement = HTMLElement>(): RefObject<T | null> => {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onDown = (e: MouseEvent) => {
      isDown = true;
      el.classList.add('active');
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };
    const onLeaveOrUp = () => {
      isDown = false;
      el.classList.remove('active');
    };
    const onMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 3;
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener('mousedown', onDown);
    el.addEventListener('mouseleave', onLeaveOrUp);
    el.addEventListener('mouseup', onLeaveOrUp);
    el.addEventListener('mousemove', onMove);

    return () => {
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mouseleave', onLeaveOrUp);
      el.removeEventListener('mouseup', onLeaveOrUp);
      el.removeEventListener('mousemove', onMove);
    };
  }, []);

  return ref;
};
