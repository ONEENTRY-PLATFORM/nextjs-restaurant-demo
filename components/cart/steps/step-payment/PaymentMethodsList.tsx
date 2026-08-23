'use client';

import Image from 'next/image';
import type { IAccountsEntity } from 'oneentry/types';
import type { JSX } from 'react';

import { useT } from '@/app/store/providers/DictProvider';

import PaymentMethodOption from './PaymentMethodOption';

type Props = {
  accounts: IAccountsEntity[];
  isLoading: boolean;
  identifier: string;
  onSelect: (identifier: string) => void;
};

/**
 * PaymentMethodsList — payment section: header + loading/empty/list of payment accounts.
 *
 * @param   {object}                          props            - Component props.
 * @param   {IAccountsEntity[]}               props.accounts   - Visible payment accounts (already filtered by `isVisible`).
 * @param   {boolean}                         props.isLoading  - Whether the accounts query is still in flight.
 * @param   {string}                          props.identifier - Currently selected account identifier.
 * @param   {(identifier: string) => void}    props.onSelect   - Selection handler.
 * @returns JSX of the payment section.
 */
const PaymentMethodsList = ({ accounts, isLoading, identifier, onSelect }: Props): JSX.Element => {
  const t = useT();

  return (
    <div className="step-payment-row mt-5 flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <Image src="/images/icons/card-line.svg" alt="" width={23} height={15} />
        <p className="text-xl font-normal text-paper">{t('select_payment_text', 'Payment')}</p>
      </div>

      {isLoading ? (
        <p className="text-paper/70">{t('loading_payment_text', 'Loading payment methods…')}</p>
      ) : accounts.length === 0 ? (
        <p className="text-paper/70">
          {t(
            'no_payment_methods_text',
            'No payment methods are configured. Please contact support.'
          )}
        </p>
      ) : (
        accounts.map(account => (
          <PaymentMethodOption
            key={account.id}
            account={account}
            checked={identifier === account.identifier}
            onSelect={() => onSelect(account.identifier)}
          />
        ))
      )}
    </div>
  );
};

export default PaymentMethodsList;
