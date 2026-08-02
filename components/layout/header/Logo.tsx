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
    <Link
      href={'/'}
      prefetch={false}
      className="logo focus:outline-none md:w-33.75 lg:w-43.5 xl:w-53.5"
    >
      <LogoIcon className={'max-w-full'} fill={'#FFFFFF'} />
    </Link>
  );
};

export default Logo;
