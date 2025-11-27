import type { JSX } from 'react';

import MenuSection from './components/MenuSection';

/**
 * Footer section of the website
 */
const Footer = async (): Promise<JSX.Element> => {
  return (
    <footer className="fade-in bg-gradient-1 max-w-full">
      <MenuSection />
    </footer>
  );
};

export default Footer;
