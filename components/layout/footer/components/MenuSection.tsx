import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { FC } from 'react';

import Copyrights from './Copyrights';

/**
 * Footer menu section
 * Displays various sections in the footer including contact info, menus, opening times, and social buttons.
 * @param dict - Dictionary containing text values for the section.
 * @returns JSX.Element
 */
const MenuSection: FC<{ dict: IAttributeValues }> = ({ dict }) => {
  const { opening_time_text, follow_us_text } = dict;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] justify-between gap-10 px-5 py-16 text-black max-lg:flex-wrap max-lg:justify-center max-md:max-w-full max-sm:gap-0">
        {/* Copyrights */}
        <div className="mb-4 hidden text-left text-base font-medium tracking-wide max-md:max-w-full max-sm:flex max-sm:text-left">
          <Copyrights />
        </div>
    </div>
  );
};

export default MenuSection;
