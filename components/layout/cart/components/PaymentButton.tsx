import type { JSX } from 'react';

import TableRowAnimations from '../animations/TableRowAnimations';

/**
 * Payment button
 */
const PaymentButton = ({
  className,
  text,
}: {
  className?: string;
  text: string;
}): JSX.Element => {
  return (
    <TableRowAnimations className={'mx-auto flex'} index={10}>
      <button
        type="submit"
        onClick={() => {}}
        className={
          'rounded-[10px] bg-custom-gradient font-bold text-[16px] uppercase text-white hover:bg-gradient-to-r-hover py-3 mt-9 self-center px-16 ' +
          className
        }
        title={text}
      >
        {text}
      </button>
    </TableRowAnimations>
  );
};

export default PaymentButton;
