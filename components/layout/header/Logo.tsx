import Link from 'next/link';
import type { JSX } from 'react';

import LogoIcon from '@/components/icons/logo';

/**
 * Logo — header logo linking to the home page.
 *
 * @returns JSX of the header logo link.
 */
const Logo = (): JSX.Element => {
  return (
    <Link href={'/'} className="logo md:w-42.5 lg:w-55 xl:w-67.5 focus:outline-none">
      <LogoIcon className={'max-w-full'} fill={'#FFFFFF'} />
    </Link>
  );
};

export default Logo;
