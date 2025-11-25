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
        className={'btn btn-lg btn-primary mt-9 self-center px-16 ' + className}
        title={text}
      >
        {text}
      </button>
    </TableRowAnimations>
  );
};

export default PaymentButton;
