import Image from 'next/image';
import type { JSX } from 'react';

export type MenuItemData = {
  id: string;
  image: string;
  time: string;
  weight: string;
  rating: string;
  title: string;
  counter: string;
  price: string;
};

/**
 * Product / menu-item card — 1:1 port of the `.menu_item` structure from
 * `static-html/index.html`. Includes image, descr strip (time / weight /
 * rating), title, counter + cart button + price row, and heart icon in the
 * top-right corner.
 * @param   {object}        props      - Component props.
 * @param   {MenuItemData}  props.item - Item data (mock or from CMS).
 * @returns {JSX.Element}              Menu item JSX.
 */
const MenuItemCard = ({ item }: { item: MenuItemData }): JSX.Element => {
  return (
    <div className="menu_item">
      <Image
        src={item.image}
        alt={item.title}
        width={340}
        height={220}
        className="w-full h-auto"
        sizes="(min-width: 1240px) 278px, (min-width: 768px) 340px, 164px"
      />

      <div className="descr">
        <p> {item.time}</p>
        <p>{item.weight}</p>
        <div className="rating">
          <Image
            className="rating_img"
            src="/images/icons/Star 16.svg"
            alt="star"
            width={16}
            height={16}
          />
          <p>{item.rating}</p>
        </div>
      </div>

      <p className="menu_item-title">{item.title}</p>

      <div className="menu_items_btn">
        <p className="counter">{item.counter}</p>
        <svg
          className="w-[20px] h-[19px] md:w-[29px] md:h-[27px]"
          viewBox="0 0 29 27"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M28.022 4.08402C27.8865 3.92559 27.7191 3.79851 27.5311 3.71136C27.3431 3.6242 27.139 3.579 26.9323 3.57879H7.01339L6.73231 1.87418C6.67635 1.53223 6.50282 1.22153 6.24258 0.997356C5.98234 0.77318 5.65226 0.650062 5.31107 0.649902H2.06788C1.68559 0.649902 1.31896 0.804192 1.04865 1.07883C0.778328 1.35346 0.626465 1.72595 0.626465 2.11435C0.626465 2.50274 0.778328 2.87523 1.04865 3.14987C1.31896 3.4245 1.68559 3.57879 2.06788 3.57879H4.09019L6.77123 19.9279L6.83609 20.1094L6.91393 20.3306L7.0869 20.5927L7.22383 20.7567L7.50203 20.9471L7.66347 21.0423C7.8311 21.1135 8.01078 21.1508 8.19247 21.1521H24.0495C24.4318 21.1521 24.7984 20.9978 25.0687 20.7232C25.3391 20.4486 25.4909 20.0761 25.4909 19.6877C25.4909 19.2993 25.3391 18.9268 25.0687 18.6522C24.7984 18.3775 24.4318 18.2232 24.0495 18.2232H9.41479L9.17551 16.7588H25.4909C25.8378 16.7588 26.173 16.6318 26.4351 16.401C26.6973 16.1702 26.8687 15.8511 26.9179 15.5023L28.3593 5.25119C28.3885 5.04345 28.3735 4.83177 28.3153 4.63042C28.2572 4.42908 28.1571 4.24276 28.022 4.08402Z"
            fill="white"
            fillOpacity="0.9"
          />
          <path
            d="M10.356 27.0099C11.5501 27.0099 12.5182 26.0264 12.5182 24.8132C12.5182 23.6001 11.5501 22.6166 10.356 22.6166C9.16192 22.6166 8.19391 23.6001 8.19391 24.8132C8.19391 26.0264 9.16192 27.0099 10.356 27.0099Z"
            fill="white"
            fillOpacity="0.9"
          />
          <path
            d="M23.3288 27.0099C24.5229 27.0099 25.4909 26.0264 25.4909 24.8132C25.4909 23.6001 24.5229 22.6166 23.3288 22.6166C22.1347 22.6166 21.1667 23.6001 21.1667 24.8132C21.1667 26.0264 22.1347 27.0099 23.3288 27.0099Z"
            fill="white"
            fillOpacity="0.9"
          />
        </svg>
        <p className="text-base md:text-[22px]">{item.price}</p>
      </div>

      <svg
        className="heart_card w-[26px] h-[21px] md:w-[38px] md:h-[30px]"
        viewBox="0 0 38 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M18.4662 4.60952L19.03 5.39613L19.5938 4.60952C21.2125 2.35111 23.9899 0.968939 27.2432 0.968831C29.6849 0.97161 32.0184 1.88902 33.7335 3.50839C35.4474 5.12657 36.4035 7.31176 36.4063 9.58205C36.4059 13.7939 33.6184 18.3289 27.778 23.0479C25.1122 25.1926 22.2324 27.089 19.1785 28.7105C19.1345 28.732 19.0834 28.7443 19.03 28.7443C18.9765 28.7443 18.9254 28.732 18.8814 28.7105C15.8277 27.0891 12.9479 25.1927 10.2822 23.0481C4.44141 18.3289 1.65383 13.7936 1.65365 9.58162C1.65657 7.31149 2.61264 5.12647 4.32641 3.50839C6.04154 1.88902 8.37498 0.97161 10.8167 0.968831C14.0701 0.968938 16.8474 2.35111 18.4662 4.60952Z"
          stroke="white"
          strokeWidth="1.38737"
        />
      </svg>
    </div>
  );
};

export default MenuItemCard;
