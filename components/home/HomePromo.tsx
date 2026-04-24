import Image from 'next/image';
import type { JSX } from 'react';

import { mobilePromos } from './mockMenuData';

/**
 * Desktop-only "DEAL OF THE DAY -50%" promotion banner + mobile-only
 * horizontal scroll of promo cards. Ports the two `<section>` blocks
 * right after the `navigation` in `static-html/index.html`.
 * @returns {JSX.Element} Promo stacked banners JSX.
 */
const HomePromo = (): JSX.Element => {
  return (
    <>
      <section
        className="promotion hidden md:bg-center md:bg-cover md:bg-no-repeat md:h-48 md:max-w-175 lg:max-w-250 xl:max-w-323 md:mx-auto md:flex md:items-center w-full mb-10"
        style={{ backgroundImage: "url('/images/picture/promo.png')" }}
      >
        <div className="promotion_counter rounded-full bg-[#ec722b] font-black text-[40px] text-white mr-10 ml-33.75 px-3 py-7.5 -mt-2.5">
          -50%
        </div>
        <div className="promotion_item pt-8.5 pb-8.75 italic font-bold md:text-[32px] lg:text-[48px] leading-[0.83] text-center text-white md:w-87.5 lg:w-152.5 border-t border-b border-custom_white">
          DEAL OF THE <span className="text-[#ec722b]">DAY</span>
        </div>
      </section>

      <section className="md:hidden">
        <h2 className="title_name max-w-88 mx-auto md:hidden">Actions</h2>
        <div className="flex overflow-x-auto overflow-y-hidden max-w-full gap-2.5 mt-3.75 no-scrollbar">
          {mobilePromos.map((src) => (
            <div
              key={src}
              className="w-86.75 h-36.25 shrink-0 object-cover relative"
            >
              <Image
                src={src}
                alt="promo"
                fill
                sizes="347px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default HomePromo;
