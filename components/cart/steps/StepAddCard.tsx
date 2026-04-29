'use client';

import type { JSX } from 'react';
import { useState } from 'react';

import { useCreateOrder } from '@/app/api';
import { useAppDispatch } from '@/app/store/hooks';
import {
  addPaymentMethod,
  setStep,
  setStepError,
} from '@/app/store/reducers/OrderSlice';
import CardLineIcon from '@/components/icons/card-line.svg';

type SavedCard = {
  id: string;
  last4: string;
};

/**
 * Checkout step — saved-cards management (per `cart_add_card.html`).
 *
 * Bottom-sheet style panel listing saved cards with a Delete control + an
 * "Add Card" row. Used between {@link StepPayment} and `success` when the
 * user picks card payment. OneEntry's card payment account is not yet
 * configured (see ONEENTRY-ADMIN-SETUP.md), so the card list and "Add Card"
 * action are local stubs that complete the flow with a synthetic card id.
 * @returns {JSX.Element} Step JSX.
 */
const StepAddCard = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const { onConfirmOrder, isLoading } = useCreateOrder();
  const [cards, setCards] = useState<SavedCard[]>([
    { id: 'card-1', last4: '4867' },
  ]);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const onDelete = (id: string) =>
    setCards((prev) => prev.filter((c) => c.id !== id));

  const onAdd = () => {
    const last4 = String(Math.floor(1000 + Math.random() * 9000));
    setCards((prev) => [...prev, { id: `card-${Date.now()}`, last4 }]);
  };

  const onContinue = async (id: string) => {
    const paymentAccountIdentifier = `card:${id}`;
    dispatch(addPaymentMethod(paymentAccountIdentifier));
    setPendingId(id);
    const result = await onConfirmOrder({ paymentAccountIdentifier });
    setPendingId(null);
    if (!result.ok) {
      dispatch(setStepError(result.error));
      return;
    }
    if (result.paymentUrl) {
      window.location.href = result.paymentUrl;
      return;
    }
    dispatch(setStep('success'));
  };

  return (
    <div className="flex flex-col gap-1.25">
      <div className="flex items-center gap-2.5">
        <CardLineIcon />
        <p className="font-normal text-[20px] text-paper">Payment</p>
      </div>

      <div className="mt-6.25 flex flex-col gap-6.25">
        {cards.map((card) => (
          <div key={card.id} className="flex items-center gap-5">
            <p className="font-normal text-[16px] text-paper">Card</p>
            <CardLineIcon />
            <div className="font-bold text-[16px] text-paper">
              ****{card.last4}
            </div>
            <button
              type="button"
              onClick={() => onDelete(card.id)}
              className="hover_btn_transp h-6.75 w-20.5 rounded-[5px] border border-brand font-bold text-[16px] text-brand"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => onContinue(card.id)}
              disabled={isLoading}
              className="ml-auto font-bold text-[16px] text-brand disabled:opacity-60"
            >
              {pendingId === card.id && isLoading ? 'Paying...' : 'Pay'}
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={onAdd}
          className="flex cursor-pointer items-center gap-3.75 pointer-events-auto touch-manipulation"
        >
          <span className="hover_btn_transp flex h-6.75 w-11.75 items-center justify-center rounded-[5px] bg-[#4c4d56] text-[20px] font-bold text-[#4c4d56]">
            +
          </span>
          <p className="font-semibold text-[16px] text-paper">Add Card</p>
        </button>
      </div>
    </div>
  );
};

export default StepAddCard;
