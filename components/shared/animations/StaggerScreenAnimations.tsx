'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useRef } from 'react';

const DEFAULT_SELECTOR = '.profile-anim-row';

/**
 * StaggerScreenAnimations — generic entry/exit stagger for screen-level rows.
 *
 * Re-runs the entry timeline whenever `screenKey` changes (so swapping the wrapped
 * screen body re-mounts the rows and they fade/slide back in). When `closing` flips
 * to `true`, runs the exit timeline and invokes `onClosed` after the reverse completes
 * — used both for closing the host drawer and for swapping between sub-screens
 * (exit → swap → entry).
 *
 * @param   {object}              props              - Component props.
 * @param   {ReactNode}           props.children     - Screen content containing elements matching `selector`.
 * @param   {string | number}     props.screenKey    - Re-runs the entry timeline when this changes.
 * @param   {boolean}             [props.closing]    - Runs the exit timeline when `true`.
 * @param   {() => void}          [props.onClosed]   - Invoked after the exit timeline completes.
 * @param   {string}              [props.selector]   - CSS selector for staggered rows (default `.profile-anim-row`).
 * @returns JSX wrapper around the screen content.
 */
const StaggerScreenAnimations = ({
  children,
  screenKey,
  closing = false,
  onClosed,
  selector = DEFAULT_SELECTOR,
}: {
  children: ReactNode;
  screenKey: string | number;
  closing?: boolean;
  onClosed?: () => void;
  selector?: string;
}): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (closing) return undefined;
      if (!containerRef.current) return undefined;
      const targets = containerRef.current.querySelectorAll(selector);
      if (targets.length === 0) return undefined;
      const tl = gsap.timeline();
      tl.set(targets, { autoAlpha: 0, yPercent: 100 }).to(targets, {
        autoAlpha: 1,
        yPercent: 0,
        duration: 0.4,
        stagger: 0.08,
        overwrite: 'auto',
      });
      return () => {
        tl.kill();
      };
    },
    { scope: containerRef, dependencies: [screenKey] }
  );

  useGSAP(
    () => {
      if (!closing || !containerRef.current) return undefined;
      const targets = containerRef.current.querySelectorAll(selector);
      if (targets.length === 0) {
        onClosed?.();
        return undefined;
      }
      const tl = gsap.timeline({
        onComplete: () => onClosed?.(),
      });
      tl.to(targets, {
        autoAlpha: 0,
        yPercent: 100,
        duration: 0.3,
        stagger: { each: 0.05, from: 'end' },
        overwrite: 'auto',
      });
      return () => {
        tl.kill();
      };
    },
    { scope: containerRef, dependencies: [closing] }
  );

  return <div ref={containerRef}>{children}</div>;
};

export default StaggerScreenAnimations;
