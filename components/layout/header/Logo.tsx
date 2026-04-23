import Link from 'next/link';
import type { JSX } from 'react';

import LogoIcon from '../../shared/LogoIcon';

/**
 * Logo component
 */
const Logo = (): JSX.Element => {
  return (
    <Link
      href={'/'}
      prefetch={false}
      className="fade-in logo w-full focus:outline-none"
    >
      <LogoIcon className={'max-w-full'} fill={'#FFFFFF'} />
    </Link>
  );
};

export default Logo;
