'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { Dispatch, JSX, ReactNode, SetStateAction } from 'react';
import { useRef } from 'react';

/**
 * ProfileMenuAnimations — open/close animation wrapper for the desktop profile dropdown.
 *
 * @param   {object}                          props           - Component props.
 * @param   {ReactNode}                       props.children  - Menu content to reveal.
 * @param   {string}                          props.className - Class merged onto the animated wrapper.
 * @param   {boolean}                         props.state     - Whether the menu should be open.
 * @param   {Dispatch<SetStateAction<boolean>>} props.setState  - Setter used by `onMouseLeave` to close the menu.
 * @returns {JSX.Element} JSX wrapper that animates open/close based on `state`.
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
