import type { JSX } from 'react';

import TableRowAnimations from '../animations/TableRowAnimations';

/**
 * Cart submit button — `APPLY` CTA from `cart_cart.html` / `pk_cart.html`.
 * Solid `bg-custom_btnorange`, full width of the cart panel, h-60 on mobile
 * and h-45 on desktop. Submits the parent form which dispatches the next
 * checkout-wizard step.
 * @param   {object}      props      - Button props.
 * @param   {string}      props.text - Button label (CMS-driven).
 * @returns {JSX.Element}            Button JSX.
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
