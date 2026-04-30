import type { JSX } from 'react';

import TableRowAnimations from '../animations/TableRowAnimations';

/**
 * Кнопка submit корзины — CTA `APPLY` из `cart_cart.html` / `pk_cart.html`.
 * Сплошной `bg-custom_btnorange`, на всю ширину панели корзины, h-60 на
 * мобильных и h-45 на десктопе. Сабмитит родительскую форму, которая делает
 * dispatch следующего шага checkout-визарда.
 * @param   {object}      props      - Пропсы кнопки.
 * @param   {string}      props.text - Подпись кнопки (из CMS).
 * @returns {JSX.Element}            JSX кнопки.
 */
const PaymentButton = ({ text }: { text: string }): JSX.Element => {
  return (
    <TableRowAnimations className={'mt-7.5 flex w-full'} index={10}>
      <button
        type="submit"
        className="flex h-15 w-full items-center justify-center rounded-[10px] bg-custom_btnorange font-normal text-[16px] text-white hover:bg-[#e44306] md:h-11.25"
        title={text}
      >
        {text}
      </button>
    </TableRowAnimations>
  );
};

export default PaymentButton;
