import Image from 'next/image';
import type { IAccountsEntity } from 'oneentry/types';
import type { JSX } from 'react';

/**
 * PaymentMethodOption — radio card for a single payment account.
 *
 * @param   {object}          props          - Component props.
 * @param   {IAccountsEntity} props.account  - OneEntry payment account entity.
 * @param   {boolean}         props.checked  - Whether the row is currently selected.
 * @param   {() => void}      props.onSelect - Selection callback invoked on radio change.
 * @returns JSX of the payment method radio row.
 */
const PaymentMethodOption = ({
  account,
  checked,
  onSelect,
}: {
  account: IAccountsEntity;
  checked: boolean;
  onSelect: () => void;
}): JSX.Element => {
  const id = `pay-${account.identifier}`;
  const label = account.localizeInfos?.title ?? account.identifier;
  const type = account.type?.toLowerCase();

  return (
    <div className="flex items-center gap-2.5 text-paper">
      <input
        type="radio"
        id={id}
        name="payment-method"
        checked={checked}
        onChange={onSelect}
        className="peer hidden"
      />
      <label htmlFor={id} className="radio-custom flex cursor-pointer items-center select-none">
        <span className="ml-2 text-paper capitalize">{label}</span>
      </label>
      {type === 'paypal' && (
        <Image src="/images/icons/paypal.png" alt="PayPal" width={68} height={18} />
      )}
      {type === 'stripe' && (
        <>
          <Image src="/images/icons/visa.png" alt="Visa" width={36} height={12} />
          <Image src="/images/icons/mastercart.png" alt="Mastercard" width={28} height={18} />
        </>
      )}
    </div>
  );
};

export default PaymentMethodOption;
