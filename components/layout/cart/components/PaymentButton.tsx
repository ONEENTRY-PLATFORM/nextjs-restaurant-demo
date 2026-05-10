import type { JSX } from 'react';

import TableRowAnimations from '../animations/TableRowAnimations';

/**
 * PaymentButton — cart submit button (CTA `APPLY`).
 *
 * @param   {object}      props      - Component props.
 * @param   {string}      props.text - Button label (from the CMS).
 * @returns {JSX.Element} JSX of the submit button wrapped in row animations.
 */
const PaymentButton = ({ text }: { text: string }): JSX.Element => {
  return (
    <TableRowAnimations className={'mt-7.5 flex w-full'} index={10}>
      <button
        type="submit"
        className="flex h-15 w-full items-center justify-center rounded-panel bg-custom_btnorange font-normal text-base text-white hover:bg-[#e44306] md:h-11.25"
        title={text}
      >
        {text}
      </button>
    </TableRowAnimations>
  );
};

export default PaymentButton;
