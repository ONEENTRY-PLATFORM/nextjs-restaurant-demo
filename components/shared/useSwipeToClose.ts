'use client';

import type { RefObject } from 'react';
import { useEffect } from 'react';

type Options = {
  /** Расстояние в px, после которого жест приводит к закрытию. */
  threshold?: number;
  /** Скорость в px/ms, после которой flick приводит к закрытию даже до threshold. */
  velocityThreshold?: number;
};

/**
 * useSwipeToClose — swipe-to-dismiss для bottom-sheet.
 * @param ref     - Элемент, который тащим (обычно `modalBody`).
 * @param onClose - Обработчик подтверждения; должен запускать тот же close-переход, что и X-кнопка.
 * @param options - Настройки.
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
      // Глушим нативный скролл — иначе вместе со sheet-ом тянется фоновая страница.
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
        // Подгоняем длительность под скорость пальца, чтобы слайд продолжил жест без визуального рывка.
        const distance = window.innerHeight - el.getBoundingClientRect().top;
        const remaining = Math.max(0, distance - dy);
        const projected = velocity > 0 ? remaining / velocity : 250;
        const duration = Math.min(280, Math.max(140, projected));
        el.style.transition = `transform ${duration}ms cubic-bezier(0.22, 0.61, 0.36, 1)`;
        el.style.transform = `translateY(${distance}px)`;
        const onEnd = () => {
          el.removeEventListener('transitionend', onEnd);
          // НЕ сбрасываем transform/transition: иначе sheet прыгнет обратно до того, как React размонтирует элемент.
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
    // touchmove НЕ passive — нужен `preventDefault` для гашения body-scroll во время swipe-down.
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
