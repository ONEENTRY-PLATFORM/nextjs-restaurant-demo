'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { JSX, ReactNode } from 'react';
import { useRef } from 'react';

/**
 * Profile menu animations on state change
 */
const ProfileMenuAnimations = ({
  children,
  className,
  state,
  setState,
}: {
  children: ReactNode;
  className: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setState: any;
}): JSX.Element => {
  const ref = useRef(null);

  // animations on state change
  useGSAP(() => {
    if (!ref.current) {
      return;
    }
    const tl = gsap.timeline({
      paused: true,
    });

    tl.from(ref.current, {
      autoAlpha: 0,
      height: 0,
    }).to(ref.current, {
      autoAlpha: 1,
      height: 'auto',
      duration: 0.5,
    });
    if (state) {
      tl.play();
    } else {
      tl.reverse(0.5);
    }

    return () => {
      tl.kill();
    };
  }, [state]);

  return (
    <div ref={ref} className={className} onMouseLeave={() => setState(false)}>
      {children}
    </div>
  );
};

export default ProfileMenuAnimations;
