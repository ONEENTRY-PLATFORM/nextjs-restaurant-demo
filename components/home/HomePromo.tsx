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
        className="promotion hidden md:bg-center md:bg-cover md:bg-no-repeat md:h-[192px] md:max-w-[700px] lg:max-w-[1000px] xl:max-w-[1292px] md:mx-auto md:flex md:items-center"
        style={{ backgroundImage: "url('/images/picture/promo.png')" }}
      >
        <div className="promotion_counter rounded-full bg-[#ec722b] font-black text-[40px] text-white mr-10 ml-[135px] px-3 py-[30px] mt-[-10px]">
          -50%
        </div>
        <div className="promotion_item pt-[34px] pb-[35px] italic font-bold md:text-[32px] lg:text-[48px] leading-[0.83] text-center text-white md:w-[350px] lg:w-[610px] border-t border-b border-[rgba(255,255,255,0.9)]">
          DEAL OF THE <span className="text-[#ec722b]">DAY</span>
        </div>
      </section>

      <section className="md:hidden">
        <h2 className="title_name max-w-[352px] mx-auto md:hidden">Actions</h2>
        <div className="flex overflow-x-auto overflow-y-hidden max-w-full gap-[10px] mt-[15px] no-scrollbar">
          {mobilePromos.map((src) => (
            <div
              key={src}
              className="w-[347px] h-[145px] flex-shrink-0 object-cover relative"
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
