import Link from 'next/link';
import type { JSX } from 'react';

import LogoIcon from '../../shared/LogoIcon';

/** Header logo. */
const Logo = (): JSX.Element => {
  return (
    <Link
      href={'/'}
      prefetch={false}
      className="fade-in logo md:w-42.5 lg:w-55 xl:w-67.5 focus:outline-none"
    >
      <LogoIcon className={'max-w-full'} fill={'#FFFFFF'} />
    </Link>
  );
};

export default Logo;
