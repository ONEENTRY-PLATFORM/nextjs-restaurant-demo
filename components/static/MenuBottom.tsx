/* eslint-disable @next/next/no-img-element */
// MenuBottom

import CloseXMiniIcon from '@/components/icons/close-x-mini';
import EyeCircleIcon from '@/components/icons/eye-circle';
import HeartScriptIcon from '@/components/icons/heart-script';
import HouseIcon from '@/components/icons/house';
import LinesBulletsIcon from '@/components/icons/lines-bullets';

const MenuBottom = () => (
  <div className="md:hidden  fixed bottom-0 left-0 z-30 w-full h-19 bg-cover bg-center">
    <div className="max-w-87.5 mx-auto flex justify-between h-19">
      <div className="flex justify-start gap-11.25 mobile_wide:gap-7.5 items-center mx-auto w-1/3 z-50">
        <div className="group">
          <a href="#">
            <HouseIcon />
          </a>
        </div>
        <div className="group_stroke">
          <a href="#">
            <HeartScriptIcon />
          </a>
        </div>
      </div>
      <div className="w-1/3  flex justify-center items-start -mt-5 p-5">
        <div className="bg-[#ec722b] hover:bg-[#EB4B0E] w-11.5 h-11.5 flex justify-center items-center rounded-full -mt-2.5 relative">
          <img
            className="w-6.25 h-5.75"
            src="/images/icons/cart_black.svg"
            alt="cart"
          />
          <div className="px-1 absolute top-2.5 right-2 rounded-full bg-white">
            <p className="font-bold text-[8px] ">2</p>
          </div>
        </div>
        <div className=" bg-transparent border w-11.5 h-11.5 flex justify-center items-center rounded-full -mt-2.5 hover:border-[#EC722B] group">
          <CloseXMiniIcon />
        </div>
      </div>
      <div className="flex justify-end gap-11.25 mobile_wide:gap-7.5 items-center mx-auto w-1/3 z-50">
        <div className="group">
          <a href="#">
            <LinesBulletsIcon />
          </a>
        </div>
        <div className="group">
          <a href="#">
            <EyeCircleIcon />
          </a>
        </div>
      </div>
    </div>
    <div className="clipped-div fixed -bottom-0.5 left-0 z-40 bg-black"></div>
  </div>
);

export default MenuBottom;
