'use client';

import type { JSX, ReactNode } from 'react';
import { useRef } from 'react';

const MenuAnimations = ({ children, className }: {
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
