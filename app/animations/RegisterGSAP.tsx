'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

import { useIsomorphicLayoutEffect } from './utils/useIsomorphicLayoutEffect';

/**
 * How much faster the global timeline runs under `prefers-reduced-motion: reduce`.
 *
 * Not `0`: a zero time scale pauses the timeline outright and animations never reach their end
 * state, leaving anything that animates in (`autoAlpha: 0` → `1`) invisible forever. A large
 * multiplier finishes every tween within a frame while keeping its end state.
 */
const REDUCED_MOTION_TIME_SCALE = 1000;

/**
 * RegisterGSAP — registers GSAP plugins and custom effects (`cardAnimations`, `slideUp`, `fadeIn`).
 *
 * @returns `null` — the component has no DOM, only side effects.
 * @see {@link https://gsap.com/cheatsheet/#plugins- gsap cheatsheet}
 */
const RegisterGSAP = () => {
  useIsomorphicLayoutEffect(() => {
    gsap.registerPlugin(useGSAP, ScrollTrigger);
    // ScrollToPlugin is only needed by TransitionProvider during route changes;
    // it registers itself there on the first `leave` to keep it out of the
    // initial layout chunk.

    gsap.config({
      autoSleep: 120,
      force3D: true,
      nullTargetWarn: false,
    });

    gsap.registerEffect({
      name: 'cardAnimations',
      effect: (
        target: gsap.TweenTarget | HTMLDivElement,
        config: { duration: number; delay: number; scrub: number | boolean }
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
          }
        );
      },
      defaults: { duration: 2, delay: 0, scrub: 4 },
      extendTimeline: true,
    });

    gsap.registerEffect({
      name: 'slideUp',
      effect: (
        target: gsap.TweenTarget | HTMLDivElement,
        config: { duration: number; delay: number }
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
          }
        );
      },
      defaults: { duration: 0.5, delay: 0 },
      extendTimeline: true,
    });

    gsap.registerEffect({
      name: 'fadeIn',
      effect: (
        target: gsap.TweenTarget | HTMLDivElement,
        config: { duration: number; delay: number }
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

    /**
     * `prefers-reduced-motion: reduce` collapses every GSAP animation to its end state.
     *
     * `globals.css` already honours the preference for CSS animations, but the GSAP half — which
     * is what actually reveals the page — ignored it, so asking for less motion still produced a
     * page of things sliding and fading in. Scaling the global timeline is the one lever that
     * covers every tween, including the ones that set their own `duration`; nothing needs to be
     * edited per component, and no end state changes — elements simply arrive there at once.
     *
     * Reacted to live rather than read once: the preference can be toggled mid-session.
     */
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyMotionPreference = (reduce: boolean): void => {
      gsap.globalTimeline.timeScale(reduce ? REDUCED_MOTION_TIME_SCALE : 1);
    };

    applyMotionPreference(query.matches);
    const onMotionPreferenceChange = (event: MediaQueryListEvent): void =>
      applyMotionPreference(event.matches);
    query.addEventListener('change', onMotionPreferenceChange);

    return () => {
      query.removeEventListener('change', onMotionPreferenceChange);
    };
  }, []);

  return null;
};

export default RegisterGSAP;
