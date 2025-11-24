'use client';

import type { FC, ReactNode } from 'react';
import { useRef } from 'react';

interface MenuAnimationsProps {
  children: ReactNode;
  className: string;
}

const MenuAnimations: FC<MenuAnimationsProps> = ({ children, className }) => {
  const ref = useRef<HTMLUListElement>(null);

  return (
    <ul ref={ref} className={className}>
      {children}
    </ul>
  );
};

export default MenuAnimations;
