import type { FC } from 'react';

import MenuSection from './components/MenuSection';

/**
 * Footer section
 * @returns React component
 */
const Footer: FC = async () => {
  return (
    <footer className="fade-in bg-gradient-1 max-w-full">
      <MenuSection />
    </footer>
  );
};

export default Footer;
