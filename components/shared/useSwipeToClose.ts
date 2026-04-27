'use client';

import type { RefObject } from 'react';
import { useEffect } from 'react';

type Options = {
  /** Distance in px past which the gesture commits a close. */
  threshold?: number;
  /** Velocity in px/ms past which a flick commits even before threshold. */
  velocityThreshold?: number;
};

/**
 * Bottom-sheet swipe-to-dismiss. Drags the target element vertically with the
 * pointer; when released past the threshold (or with enough downward velocity)
 * fires `onClose`. Otherwise springs back to origin via a CSS transition.
 *
 * Skips the gesture when the touch starts on a scrollable child that has
 * already been scrolled, so vertical scrolling inside the sheet still works.
 * @param ref - Element being dragged (typically the sheet body / modalBody).
 * @param onClose - Commit handler. Should trigger the same close transition
 * the sheet uses for its own X button.
 * @param options - Tuning knobs.
 */
export const useSwipeToClose = (
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  options: Options = {},
): void => {
  const { threshold = 100, velocityThreshold = 0.6 } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    let startY = 0;
    let startTime = 0;
    let dy = 0;
    let dragging = false;

    const reset = () => {
      el.style.transition = 'transform 0.25s ease-out';
      el.style.transform = '';
      window.requestAnimationFrame(() => {
        el.style.transition = '';
      });
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        return;
      }
      // Allow inner scroll: skip if the user starts the gesture inside a
      // scrolled container.
      let node: HTMLElement | null = e.target as HTMLElement;
      while (node && node !== el) {
        if (node.scrollTop > 0) {
          return;
        }
        node = node.parentElement;
      }
      startY = e.touches[0]!.clientY;
      startTime = e.timeStamp;
      dy = 0;
      dragging = true;
      el.style.transition = '';
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragging) {
        return;
      }
      dy = e.touches[0]!.clientY - startY;
      if (dy <= 0) {
        el.style.transform = '';
        return;
      }
      el.style.transform = `translateY(${dy}px)`;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!dragging) {
        return;
      }
      dragging = false;
      const elapsed = Math.max(1, e.timeStamp - startTime);
      const velocity = dy / elapsed;
      if (dy > threshold || velocity > velocityThreshold) {
        const distance = window.innerHeight - el.getBoundingClientRect().top;
        el.style.transition = 'transform 0.2s ease-in';
        el.style.transform = `translateY(${distance}px)`;
        window.setTimeout(() => {
          el.style.transition = '';
          el.style.transform = '';
          onClose();
        }, 180);
      } else {
        reset();
      }
    };

    const onTouchCancel = () => {
      if (dragging) {
        dragging = false;
        reset();
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchCancel);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [ref, onClose, threshold, velocityThreshold]);
};
