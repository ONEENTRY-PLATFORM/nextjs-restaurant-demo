'use client';

import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';

/**
 * Attaches mouse-based drag-to-scroll behavior to a horizontally scrollable
 * element — replicates the behavior from `static-html/script.js` on
 * `#menuItems`. Touch scrolling is already native so no handlers needed.
 *
 * Usage:
 * ```tsx
 * const ref = useDragScroll<HTMLUListElement>();
 * return <ul ref={ref} className="overflow-x-auto">...</ul>;
 * ```
 * @returns {RefObject<T | null>} A ref to attach to the scrollable element.
 */
export const useDragScroll = <
  T extends HTMLElement = HTMLElement,
>(): RefObject<T | null> => {
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
