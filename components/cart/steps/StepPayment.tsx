'use client';

import Image from 'next/image';
import type { JSX } from 'react';
import { useState } from 'react';

import { useAppDispatch } from '@/app/store/hooks';
import { addPaymentMethod, setStep } from '@/app/store/reducers/OrderSlice';

type SavedCard = {
  id: string;
  last4: string;
};

const SAVED_CARDS_KEY = 'saved-payment-cards';

/**
 * Read the list of saved (masked) payment cards from localStorage.
 * This is a visual stand-in — real PCI-DSS tokenization must be delegated
 * to a payment provider (Stripe / PayPal / etc.).
 * @returns {SavedCard[]} Saved card list (empty on miss / SSR).
 */
const readSavedCards = (): SavedCard[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_CARDS_KEY);
    return raw ? (JSON.parse(raw) as SavedCard[]) : [];
  } catch {
    return [];
  }
};

/**
 * Checkout step — choose payment method (per `cart_PAYMENT.html`).
 * Renders:
 *   - Saved card rows (if any) with Delete action;
 *   - "Add card" CTA → routes to `add_card` step;
 *   - PayPal / cash radios — cash routes directly to `success`.
 * @returns {JSX.Element} Step JSX.
 */
const StepPayment = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const [cards, setCards] = useState<SavedCard[]>(readSavedCards);
  const [method, setMethod] = useState<'cash' | 'paypal' | 'card'>('cash');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const deleteCard = (id: string) => {
    const next = cards.filter((c) => c.id !== id);
    setCards(next);
    if (selectedCard === id) setSelectedCard(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(next));
    }
  };

  const onNext = () => {
    if (method === 'card' && !selectedCard && cards.length === 0) {
      dispatch(addPaymentMethod('card'));
      dispatch(setStep('add_card'));
      return;
    }
    dispatch(addPaymentMethod(method));
    if (method === 'cash') {
      dispatch(setStep('success'));
    } else {
      dispatch(setStep('success'));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-[10px]">
        <svg
          width="23"
          height="15"
          viewBox="0 0 23 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M22 4.71429V12.1429C22 12.6354 21.7918 13.1078 21.4211 13.4561C21.0504 13.8043 20.5477 14 20.0235 14H2.97647C2.45228 14 1.94955 13.8043 1.57889 13.4561C1.20823 13.1078 1 12.6354 1 12.1429V2.85714C1 2.3646 1.20823 1.89223 1.57889 1.54394C1.94955 1.19566 2.45228 1 2.97647 1H20.0235C20.5477 1 21.0504 1.19566 21.4211 1.54394C21.7918 1.89223 22 2.3646 22 2.85714V4.71429ZM22 4.71429H7.42353"
            stroke="#DFE9F9"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="font-normal text-[20px] text-paper">Payment</p>
      </div>

      {/* Saved cards */}
      {cards.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {cards.map((card) => (
            <li key={card.id} className="flex items-center gap-5">
              <input
                type="radio"
                id={`saved-${card.id}`}
                name="payment-method"
                className="hidden peer"
                checked={method === 'card' && selectedCard === card.id}
                onChange={() => {
                  setMethod('card');
                  setSelectedCard(card.id);
                }}
              />
              <label
                htmlFor={`saved-${card.id}`}
                className="radio-custom flex items-center gap-3 cursor-pointer select-none"
              >
                <span className="ml-2 font-normal text-[16px] text-paper">
                  Card
                </span>
              </label>
              <svg
                width="40"
                height="27"
                viewBox="0 0 40 27"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M39 8.35714V22.0714C39 22.9807 38.6232 23.8528 37.9525 24.4958C37.2818 25.1388 36.3721 25.5 35.4235 25.5H4.57647C3.62793 25.5 2.71824 25.1388 2.04752 24.4958C1.37681 23.8528 1 22.9807 1 22.0714V4.92857C1 4.01926 1.37681 3.14719 2.04752 2.50421C2.71824 1.86122 3.62793 1.5 4.57647 1.5H35.4235C36.3721 1.5 37.2818 1.86122 37.9525 2.50421C38.6232 3.14719 39 4.01926 39 4.92857V8.35714ZM39 8.35714H12.6235"
                  stroke="#DFE9F9"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-bold text-[16px] text-paper">
                ****{card.last4}
              </span>
              <button
                type="button"
                onClick={() => deleteCard(card.id)}
                className="ml-auto rounded-[5px] border border-brand px-2 h-7 text-sm font-bold text-brand hover_btn_transp"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Add card row */}
      <button
        type="button"
        onClick={() => {
          setMethod('card');
          dispatch(addPaymentMethod('card'));
          dispatch(setStep('add_card'));
        }}
        className="flex items-center gap-[15px] touch-manipulation pointer-events-auto cursor-pointer"
      >
        <span className="bg-custom_gray rounded-[5px] w-[47px] h-[27px] text-[20px] font-bold text-ink flex justify-center items-center hover_btn_transp">
          +
        </span>
        <span className="text-[16px] text-paper font-semibold">Add Card</span>
      </button>

      {/* PayPal */}
      <div className="flex items-center gap-[10px] text-paper">
        <input
          type="radio"
          id="pay-paypal"
          name="payment-method"
          checked={method === 'paypal'}
          onChange={() => setMethod('paypal')}
          className="hidden peer"
        />
        <label
          htmlFor="pay-paypal"
          className="radio-custom flex items-center cursor-pointer select-none"
        >
          <span className="ml-2 text-paper">Pay with</span>
        </label>
        <Image
          src="/images/icons/paypal.png"
          alt="PayPal"
          width={68}
          height={18}
        />
      </div>

      {/* Cash */}
      <div className="flex items-center gap-[10px] text-paper">
        <input
          type="radio"
          id="pay-cash"
          name="payment-method"
          checked={method === 'cash'}
          onChange={() => setMethod('cash')}
          className="hidden peer"
        />
        <label
          htmlFor="pay-cash"
          className="radio-custom flex items-center cursor-pointer select-none"
        >
          <span className="ml-2 text-paper">Cash on delivery</span>
        </label>
      </div>

      <button type="button" onClick={onNext} className="cart_btn">
        Continue
      </button>
    </div>
  );
};

export default StepPayment;
