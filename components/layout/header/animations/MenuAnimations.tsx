'use client';

import type { JSX, ReactNode } from 'react';
import { useRef } from 'react';

/**
 * MenuAnimations — pass-through wrapper for the header menu list (currently no animation).
 *
 * @param   {object}      props           - Component props.
 * @param   {ReactNode}   props.children  - Menu items to render.
 * @param   {string}      props.className - Class merged onto the wrapping `<ul>`.
 * @returns JSX of the menu list.
 */
const MenuAnimations = ({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}): JSX.Element => {
  const ref = useRef<HTMLUListElement>(null);

  return (
    <ul ref={ref} className={className}>
      {children}
    </ul>
  );
};

export default MenuAnimations;
