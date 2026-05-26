'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import Image from 'next/image';
import { useTransitionState } from 'next-transition-router';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';
import { useContext, useRef, useState } from 'react';

import { getProductImageUrl, useApplyCoupon } from '@/app/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { selectCartData } from '@/app/store/reducers/CartSlice';
import { selectAppliedCoupon, setStep } from '@/app/store/reducers/OrderSlice';
import { DELIVERY_PRODUCT_ID } from '@/app/utils/constants';
import Placeholder from '@/components/shared/Placeholder';
import { UsePrice } from '@/components/utils';

const ORDER_ROW_SELECTOR = '.step-order-row';

type CartEntry = {
  id: number;
  quantity?: number;
  selected?: boolean;
};

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

  const [promoCode, setPromoCode] = useState(appliedCoupon?.code ?? '');
  const { applyCoupon, removeCoupon, isLoading, error } = useApplyCoupon();

  const items = cartData
    .map(entry => ({
      entry,
      product: products.find(p => p.id === entry.id),
    }))
    .filter(
      row =>
        row.product &&
        row.entry.selected &&
        row.product.statusIdentifier !== 'out_of_stock' &&
        // Delivery shows as a separate line in the totals - otherwise it gets double-counted in the subtotal.
        row.entry.id !== DELIVERY_PRODUCT_ID
    ) as Array<{
    entry: CartEntry;
    product: IProductsEntity;
  }>;

  const subtotal = items.reduce((sum, { entry, product }) => {
    const price = product.price ?? 0;
    return sum + price * (entry.quantity ?? 1);
  }, 0);
  const discount = appliedCoupon
    ? Math.max(0, appliedCoupon.totalSum - appliedCoupon.totalSumWithDiscount)
    : 0;
  // "To Entire Order" coupon: `totalSumWithDiscount` already includes delivery - do not add it again, otherwise it gets double-counted.
  const total = appliedCoupon ? appliedCoupon.totalSumWithDiscount : subtotal + deliveryPrice;

  const handleApply = (): void => {
    if (appliedCoupon && appliedCoupon.code === promoCode.trim()) {
      removeCoupon();
      setPromoCode('');
      return;
    }
    void applyCoupon(promoCode);
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
      {/* Items */}
      <div className="flex flex-col gap-5">
        {items.map(({ entry, product }) => {
          const title = product.localizeInfos?.title ?? 'Item';
          const weight = product.attributeValues?.weight?.value as string | number | undefined;
          const unit = product.price ?? 0;
          const imgSrc = getProductImageUrl(product.attributeValues);
          return (
            <div
              key={entry.id}
              className="step-order-row flex items-center justify-between gap-2.5"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative size-17.25 shrink-0 overflow-hidden rounded">
                  {imgSrc ? (
                    <Image
                      src={imgSrc}
                      alt={title}
                      width={69}
                      height={69}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Placeholder />
                  )}
                </div>
                <div className="flex min-w-0 flex-col justify-between gap-1">
                  <p className="font-normal text-sm text-white">{title}</p>
                  <div className="flex items-center gap-2.5">
                    {weight ? <p className="font-normal text-sm text-white">{weight} g</p> : null}
                    <p className="font-bold text-xl text-brand">{UsePrice({ amount: unit })}</p>
                  </div>
                </div>
              </div>
              <div className="flex h-11.25 w-8.75 shrink-0 items-center justify-center rounded-card border border-white text-base font-normal text-brand">
                x{entry.quantity ?? 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* Promo code */}
      <div className="step-order-row mt-5 flex w-full flex-col gap-1.5">
        <div className="flex w-full items-center justify-between gap-6.25">
          <input
            type="text"
            value={promoCode}
            onChange={e => setPromoCode(e.currentTarget.value)}
            disabled={isLoading}
            placeholder={t('promo_code_text', 'Promo Code')}
            className="h-8 w-2/3 rounded-card border border-brand bg-transparent text-center text-base uppercase text-white placeholder:text-center placeholder:text-base placeholder:uppercase placeholder:text-white focus:outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleApply}
            disabled={isLoading || (!appliedCoupon && !promoCode.trim())}
            className="h-8 w-1/3 rounded-card border-none bg-brand px-2.5 text-[13px] font-normal uppercase text-black hover_btn_transp disabled:cursor-not-allowed disabled:opacity-60 lg:text-[14px]"
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

      {/* Totals */}
      <div className="step-order-row mt-10 rounded-card border border-brand p-2.5">
        <div className="flex gap-1.25 text-white">
          <p>{t('subtotal_text', 'Subtotal')}:</p>
          <p>{UsePrice({ amount: subtotal })}</p>
        </div>
        <div className="flex gap-1.25 text-brand">
          <p>{t('delivery_text', 'Delivery')}:</p>
          <p>{UsePrice({ amount: deliveryPrice })}</p>
        </div>
        {discount > 0 ? (
          <div className="flex gap-1.25 text-brand">
            <p>Discount:</p>
            <p>{UsePrice({ amount: discount })}</p>
          </div>
        ) : null}
        <div className="flex gap-1.25 text-white">
          <p>{t('total_amount_text', 'Total Amount')}:</p>
          <p>{UsePrice({ amount: total })}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleProceedToPayment}
        className="step-order-row mx-auto mt-7.5 flex w-full items-center justify-center rounded-panel bg-brand py-2.5 text-center font-normal text-base text-white transition-colors duration-200 hover:bg-brand-hover active:bg-brand-active"
      >
        {isAuth ? 'APPLY' : t('login_to_continue', 'Sign in to continue')}
      </button>
    </div>
  );
};

export default StepOrder;
