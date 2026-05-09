'use client';

import type { RefObject } from 'react';
import { useEffect } from 'react';

type Options = {
  /** Distance in px past which the gesture triggers a close. */
  threshold?: number;
  /** Velocity in px/ms past which a flick closes even before reaching `threshold`. */
  velocityThreshold?: number;
};

/**
 * useSwipeToClose — swipe-to-dismiss for a bottom-sheet.
 * @param ref     - The element being dragged (usually `modalBody`).
 * @param onClose - Confirmation handler; must trigger the same close transition as the X button.
 * @param options - Options.
 */
export const useSwipeToClose = (
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  options: Options = {}
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
      // Suppress native scroll — otherwise the background page drags along with the sheet.
      if (e.cancelable) {
        e.preventDefault();
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
        // Match the duration to the finger velocity so the slide continues the gesture without a visual jolt.
        const distance = window.innerHeight - el.getBoundingClientRect().top;
        const remaining = Math.max(0, distance - dy);
        const projected = velocity > 0 ? remaining / velocity : 250;
        const duration = Math.min(280, Math.max(140, projected));
        el.style.transition = `transform ${duration}ms cubic-bezier(0.22, 0.61, 0.36, 1)`;
        el.style.transform = `translateY(${distance}px)`;
        const onEnd = () => {
          el.removeEventListener('transitionend', onEnd);
          // Do NOT reset transform/transition: otherwise the sheet would jump back before React unmounts the element.
          onClose();
        };
        el.addEventListener('transitionend', onEnd);
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
    // touchmove must NOT be passive — we need `preventDefault` to suppress body-scroll during swipe-down.
    el.addEventListener('touchmove', onTouchMove, { passive: false });
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
