'use client';

import Image from 'next/image';
import type { IBonusTransactionType } from 'oneentry/types';
import type { JSX } from 'react';
import { useContext, useState } from 'react';

import { useGetBonusBalanceQuery, useGetBonusHistoryQuery } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { formatDate } from '@/app/utils/formatDate';

/** Whether a bonus transaction type adds to or subtracts from the balance. */
const SIGN_BY_TYPE: Record<IBonusTransactionType, '+' | '-'> = {
  ACCRUAL: '+',
  REVERSAL_USAGE: '+',
  USAGE: '-',
  REDUCE: '-',
  REVERSAL_ACCRUAL: '-',
  EXPIRATION: '-',
};

/**
 * BonusSection — collapsible "Bonus balance" section in the profile drawer.
 *
 * Reads the loyalty balance and transaction history via the Discounts API (auth-only;
 * the queries are skipped for guests, and history loads lazily when the row is opened).
 * Degrades gracefully to a `0` balance / empty list when the bonus program is not yet
 * configured in the admin panel.
 *
 * @returns JSX of the bonus section, or `null` for unauthenticated users.
 */
const BonusSection = (): JSX.Element | null => {
  const t = useT();
  const { isAuth } = useContext(AuthContext);
  const [open, setOpen] = useState(false);

  const { data: balance } = useGetBonusBalanceQuery(undefined, { skip: !isAuth });
  const { data: history } = useGetBonusHistoryQuery(undefined, { skip: !isAuth || !open });

  if (!isAuth) {
    return null;
  }

  const points = balance?.balance ?? 0;
  const txns = history ?? [];

  return (
    <div className="profile-anim-row">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="mt-5 flex w-full items-center justify-start gap-2.5"
      >
        <p className="text-xl text-paper">
          {t('bonus_balance_title', 'Bonus balance')}: {points}
        </p>
        <Image
          src="/images/icons/chevron-up.svg"
          alt=""
          width={12}
          height={7}
          className={`transition-transform ${open ? '' : 'rotate-180'}`}
        />
      </button>

      {open && (
        <div className="mt-5 flex flex-col gap-2.5">
          {txns.length === 0 ? (
            <p className="text-base font-normal text-muted-text">
              {t('bonus_history_empty', 'No bonus transactions yet.')}
            </p>
          ) : (
            txns.map((txn, i) => (
              <div
                key={`${txn.balanceId}-${i}`}
                className="profile-anim-row flex items-center justify-between gap-2.5"
              >
                <span className="text-base font-normal text-white">{txn.comment || txn.type}</span>
                <span className="text-base font-normal text-muted-text">
                  {txn.createdAt ? formatDate(txn.createdAt) : ''}
                </span>
                <span className="text-base font-bold text-brand">
                  {SIGN_BY_TYPE[txn.type] ?? ''}
                  {txn.amount}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BonusSection;
