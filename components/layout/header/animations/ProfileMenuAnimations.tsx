'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { Dispatch, JSX, ReactNode, SetStateAction } from 'react';
import { useRef } from 'react';

/**
 * Анимации меню профиля при изменении state
 */
const ProfileMenuAnimations = ({
  children,
  className,
  state,
  setState,
}: {
  children: ReactNode;
  className: string;
  state: boolean;
  setState: Dispatch<SetStateAction<boolean>>;
}): JSX.Element => {
  const ref = useRef(null);

  // анимации при изменении state
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
