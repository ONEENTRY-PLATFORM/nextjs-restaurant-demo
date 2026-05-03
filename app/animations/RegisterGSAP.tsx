'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/dist/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

import { useIsomorphicLayoutEffect } from './utils/useIsomorphicLayoutEffect';

/**
 * Регистрирует плагины GSAP
 * @see {@link https://gsap.com/cheatsheet/#plugins- gsap cheatsheet}
 * @returns {JSX.Element} - Пустой компонент
 */
const RegisterGSAP = () => {
  useIsomorphicLayoutEffect(() => {
    gsap.registerPlugin(useGSAP, ScrollTrigger);
    gsap.registerPlugin(ScrollToPlugin);

    gsap.config({
      autoSleep: 120,
      force3D: true,
      nullTargetWarn: false,
      // units: {left: "%", top: "%", rotation: "rad"}
    });

    // cardAnimations с scrub
    gsap.registerEffect({
      name: 'cardAnimations',
      effect: (
        target: gsap.TweenTarget | HTMLDivElement,
        config: { duration: number; delay: number; scrub: number | boolean },
      ) => {
        const tl = gsap.timeline({
          paused: true,
          autoRemoveChildren: true,
          scrollTrigger: {
            trigger: target as HTMLDivElement,
            scrub: config.scrub,
            toggleActions: 'restart reverse restart reverse',
            start: 'top bottom',
            end: 'center bottom',
          },
        });

        return tl.fromTo(
          target,
          {
            autoAlpha: 0,
            scale: 0.8,
            yPercent: 100,
          },
          {
            autoAlpha: 1,
            scale: 1,
            yPercent: 0,
            delay: config.delay,
            duration: config.duration,
          },
        );
      },
      defaults: { duration: 2, delay: 0, scrub: 4 },
      extendTimeline: true,
    });
    // Теперь можно использовать так:
    // gsap.effects.cardAnimations('.box', { duration: 3 });
    // Или напрямую на timeline-ах
    // tl.fade('.box', { duration: 3 });

    /**
     * Анимации slideUp
     */
    gsap.registerEffect({
      name: 'slideUp',
      effect: (
        target: gsap.TweenTarget | HTMLDivElement,
        config: { duration: number; delay: number },
      ) => {
        const tl = gsap.timeline({
          paused: true,
        });

        return tl.fromTo(
          target,
          {
            autoAlpha: 0,
            yPercent: 100,
          },
          {
            autoAlpha: 1,
            yPercent: 0,
            duration: config.duration,
            delay: config.delay,
          },
        );
      },
      defaults: { duration: 0.5, delay: 0 },
      extendTimeline: true,
    });

    /**
     * Анимации fadeInOut
     */
    gsap.registerEffect({
      name: 'fadeIn',
      effect: (
        target: gsap.TweenTarget | HTMLDivElement,
        config: { duration: number; delay: number },
      ) => {
        const tl = gsap.timeline();

        return tl
          .set(target, {
            autoAlpha: 0,
          })
          .to(target, {
            autoAlpha: 1,
            duration: config.duration,
            delay: config.delay,
          });
      },
      defaults: { duration: 0.5, delay: 0 },
      extendTimeline: true,
    });
  }, []);

  return null;
};

export default RegisterGSAP;
