import type { JSX } from 'react';

import TableRowAnimations from '../animations/TableRowAnimations';

/**
 * PaymentButton — submit-кнопка корзины (CTA `APPLY`).
 *
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
