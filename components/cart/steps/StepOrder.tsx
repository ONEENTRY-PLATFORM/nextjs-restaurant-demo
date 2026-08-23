'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { useTransitionState } from 'next-transition-router';
import type { IProductsEntity } from 'oneentry/types';
import type { JSX } from 'react';
import { useContext, useRef, useState } from 'react';

import { useApplyCoupon, useGetBonusBalanceQuery, useOrderPreview } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { useOutOfStockMarker } from '@/app/store/providers/ProductStatusContext';
import { selectCartData } from '@/app/store/reducers/CartSlice';
import {
  clearBonusAmount,
  selectAppliedCoupon,
  selectBonusAmount,
  setBonusAmount,
  setStep,
} from '@/app/store/reducers/OrderSlice';
import OrderItemsList from '@/components/cart/steps/OrderItemsList';
import OrderTotals from '@/components/cart/steps/OrderTotals';
import {
  type CartEntry,
  computeClientTotals,
  ORDER_ROW_SELECTOR,
  selectOrderItems,
} from '@/components/cart/steps/stepOrderUtils';
import CheckboxMarkIcon from '@/components/icons/checkbox-mark.svg';

/**
 * StepOrder — checkout step: items + promo code + summary + APPLY → `payment` (or opens auth picker for guests).
 *
 * @returns JSX of the order step body.
 */
const StepOrder = (): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  const { isAuth } = useContext(AuthContext);
  const { setComponent, setOpen } = useContext(OpenDrawerContext);
  const cartData = useAppSelector(selectCartData) as CartEntry[];
  const products = useAppSelector(state => state.cartReducer.products) as IProductsEntity[];
  const deliveryPrice = useAppSelector(state => state.cartReducer.delivery?.price ?? 0);
  const appliedCoupon = useAppSelector(selectAppliedCoupon);
  const bonusAmount = useAppSelector(selectBonusAmount);

  // Bonus balance is auth-only; guests skip the query and never see the toggle.
  const { data: bonusBalance } = useGetBonusBalanceQuery(undefined, { skip: !isAuth });
  const availableBonus = bonusBalance?.balance ?? 0;
  const bonusEnabled = (bonusAmount ?? 0) > 0;

  const [promoCode, setPromoCode] = useState(appliedCoupon?.code ?? '');
  const { applyCoupon, removeCoupon, isLoading, error } = useApplyCoupon();
  const outOfStockMarker = useOutOfStockMarker();

  const items = selectOrderItems(cartData, products, outOfStockMarker);

  // Server-authoritative totals (discounts/bonuses/taxes) for authed users; client math is the fallback.
  const { totals: serverTotals } = useOrderPreview(appliedCoupon?.code, bonusAmount);
  const display = serverTotals ?? computeClientTotals(items, appliedCoupon, deliveryPrice);
  // Real currency only exists on the server preview (ServerOrderTotals.currency); the client
  // fallback object has none, so UsePrice falls back to the project default (USD).
  const displayCurrency = serverTotals?.currency;

  const handleApply = (): void => {
    if (appliedCoupon && appliedCoupon.code === promoCode.trim()) {
      removeCoupon();
      setPromoCode('');
      return;
    }
    void applyCoupon(promoCode);
  };

  // Spend the full balance; the server caps `bonusApplied` to the amount due (see preview totals).
  const handleToggleBonus = (): void => {
    if (bonusEnabled) {
      dispatch(clearBonusAmount());
    } else {
      dispatch(setBonusAmount(availableBonus));
    }
  };

  // Order row animation: slide-up + fade on mount, reverse on route transition (see CartAnimations).
  const containerRef = useRef<HTMLDivElement>(null);
  const { stage } = useTransitionState();
  const [prevStage, setPrevStage] = useState<string>('');

  useGSAP(
    () => {
      if (!containerRef.current) return undefined;
      const targets = containerRef.current.querySelectorAll(ORDER_ROW_SELECTOR);
      if (targets.length === 0) return undefined;
      const tl = gsap.timeline();
      tl.set(targets, { autoAlpha: 0, yPercent: 100 }).to(targets, {
        autoAlpha: 1,
        yPercent: 0,
        duration: 0.4,
        stagger: 0.08,
      });
      return () => {
        tl.kill();
      };
    },
    { scope: containerRef, dependencies: [items.length] }
  );

  // Reverse animation on route leave: paused timeline + play() strictly on the 'none' -> 'leaving' transition.
  useGSAP(() => {
    const tl = gsap.timeline({ paused: true });

    if (stage === 'leaving' && prevStage === 'none' && containerRef.current) {
      const targets = containerRef.current.querySelectorAll(ORDER_ROW_SELECTOR);
      if (targets.length > 0) {
        tl.to(targets, {
          autoAlpha: 0,
          yPercent: 100,
          duration: 0.4,
          stagger: { each: 0.07, from: 'end' },
        });
        tl.play();
      }
    }

    setPrevStage(stage);

    return () => {
      tl.kill();
    };
  }, [stage]);

  const handleProceedToPayment = (): void => {
    if (!isAuth) {
      setComponent('AuthProviderSelect');
      setOpen(true);
      return;
    }
    const root = containerRef.current;
    const targets = root?.querySelectorAll(ORDER_ROW_SELECTOR);
    if (!targets || targets.length === 0) {
      dispatch(setStep('payment'));
      return;
    }
    gsap.to(targets, {
      autoAlpha: 0,
      yPercent: 100,
      duration: 0.35,
      stagger: { each: 0.07, from: 'end' },
      onComplete: () => {
        dispatch(setStep('payment'));
        // Reset so that on returning to the step the entrance timeline starts cleanly.
        gsap.set(targets, { autoAlpha: 1, yPercent: 0 });
      },
    });
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-5">
      <OrderItemsList items={items} displayCurrency={displayCurrency} />

      {/* Promo code */}
      <div className="step-order-row mt-5 flex w-full flex-col gap-1.5">
        <div className="flex w-full items-center justify-between gap-6.25">
          <input
            type="text"
            value={promoCode}
            onChange={e => setPromoCode(e.currentTarget.value)}
            disabled={isLoading}
            placeholder={t('promo_code_text', 'Promo Code')}
            className="h-8 w-2/3 rounded-card border border-brand bg-transparent text-center text-base text-white uppercase placeholder:text-center placeholder:text-base placeholder:text-white placeholder:uppercase focus:outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleApply}
            disabled={isLoading || (!appliedCoupon && !promoCode.trim())}
            className="hover_btn_transp h-8 w-1/3 rounded-card border-none bg-brand px-2.5 text-[13px] font-normal text-black uppercase disabled:cursor-not-allowed disabled:opacity-60 lg:text-[14px]"
          >
            {isLoading
              ? t('applying_text', 'Applying')
              : appliedCoupon && appliedCoupon.code === promoCode.trim()
                ? t('remove_button', 'Remove')
                : t('apply_code_button', 'Apply Code')}
          </button>
        </div>
        {error ? (
          <p className="text-xs text-red-500" role="alert">
            {error}
          </p>
        ) : null}
        {appliedCoupon && !error ? (
          <p className="text-xs text-brand">
            {t('coupon_text', 'Coupon')}{' '}
            <span className="font-bold uppercase">{appliedCoupon.code}</span>{' '}
            {t('coupon_applied_suffix', 'applied')}
          </p>
        ) : null}
      </div>

      {/* Pay with bonuses (auth-only; hidden when the balance is empty) */}
      {availableBonus > 0 ? (
        <label className="step-order-row custom-checkbox flex items-center text-[14px] text-paper">
          <input type="checkbox" checked={bonusEnabled} onChange={handleToggleBonus} />
          <span className="checkbox-box mr-2.5">
            <CheckboxMarkIcon />
          </span>
          {t('bonus_pay_label', 'Pay with bonuses')} ({t('bonus_balance_title', 'Bonus balance')}:{' '}
          {availableBonus})
        </label>
      ) : null}

      <OrderTotals display={display} displayCurrency={displayCurrency} />

      <button
        type="button"
        onClick={handleProceedToPayment}
        className="step-order-row mx-auto mt-7.5 flex w-full items-center justify-center rounded-panel bg-brand py-2.5 text-center text-base font-normal text-white transition-colors duration-200 hover:bg-brand-hover active:bg-brand-active"
      >
        {isAuth
          ? t('proceed_payment_button', 'APPLY')
          : t('login_to_continue', 'Sign in to continue')}
      </button>
    </div>
  );
};

export default StepOrder;
