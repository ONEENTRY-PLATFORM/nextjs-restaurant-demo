import Image from 'next/image';
import type { JSX } from 'react';

import CartAddIcon from '@/components/icons/cart-add';
import HeartCardIcon from '@/components/icons/heart-card';

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
            style={{ width: 'auto', height: 'auto' }}
          />
          <p>{item.rating}</p>
        </div>
      </div>

      <p className="menu_item-title">{item.title}</p>

      <div className="menu_items_btn">
        <p className="counter">{item.counter}</p>
        <CartAddIcon className="w-5 h-4.75 md:w-7.25 md:h-6.75" />
        <p className="text-base md:text-[22px]">{item.price}</p>
      </div>

      <HeartCardIcon className="heart_card w-6.5 h-5.25 md:w-9.5 md:h-7.5" />
    </div>
  );
};

export default MenuItemCard;
