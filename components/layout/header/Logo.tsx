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
      className="fade-in logo md:w-[170px] lg:w-[220px] xl:w-[270px] focus:outline-none"
    >
      <LogoIcon className={'max-w-full'} fill={'#FFFFFF'} />
    </Link>
  );
};

export default Logo;
