'use client';

import type { JSX } from 'react';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useGetFormByMarkerQuery } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { ORDER_STATUSES } from '@/app/utils/constants';
import { formatDate } from '@/app/utils/formatDate';
import ArrowBackIcon from '@/components/icons/arrow-back';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import {
  clearOrderReviewTarget,
  useOrderReviewTarget,
} from '@/components/profile/orderReviewStore';
import {
  DEFAULT_MODULE_CONFIG_ID,
  type ExistingReview,
  fetchUserReview,
  FORM_MARKER,
  formatOrderNumber,
} from '@/components/profile/orderReviewUtils';
import ReviewableItem from '@/components/profile/ReviewableItem';
import DrawerAnimations from '@/components/shared/animations/DrawerAnimations';
import ClosePopupButton from '@/components/shared/ClosePopupButton';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

/**
 * OrderReviewPopup — "Leave a review" popup for the entire order (one button per order).
 *
 * @returns JSX of the order-review popup, or empty fragment when no order is targeted.
 */
const OrderReviewPopup = (): JSX.Element => {
  const t = useT();
  const { open, component, setOpen, setTransition } = useContext(OpenDrawerContext);
  const { isAuth, user } = useContext(AuthContext);
  const { order, productsById } = useOrderReviewTarget();
  const { data: reviewForm } = useGetFormByMarkerQuery({ marker: FORM_MARKER });
  const moduleConfigId = reviewForm?.moduleFormConfigs?.[0]?.id ?? DEFAULT_MODULE_CONFIG_ID;
  const isOpen = open && component === 'OrderReviewPopup';
  const sheetRef = useRef<HTMLDivElement | null>(null);

  // Map productId -> existing review (null = none, missing key = still loading).
  const [existingReviews, setExistingReviews] = useState<Map<number, ExistingReview | null>>(
    new Map()
  );
  const [prefilling, setPrefilling] = useState(false);

  useSwipeToClose(sheetRef, () => setOpen(false));

  useEffect(() => {
    if (!isOpen) {
      clearOrderReviewTarget();
      // Reset-on-close: a reopened popup must prefill from scratch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExistingReviews(new Map());
    }
  }, [isOpen]);

  const orderId = order?.id ?? null;
  const userId = user?.identifier ?? '';

  // Unique productIds - a review is left once per product, even if the line item repeats in the order.
  const productIds = useMemo(() => {
    if (!order) return [] as number[];
    const seen = new Set<number>();
    const ids: number[] = [];
    for (const p of order.products) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        ids.push(p.id);
      }
    }
    return ids;
  }, [order]);

  useEffect(() => {
    if (!isOpen || !orderId || !userId || productIds.length === 0) return;
    let cancelled = false;
    // Mark "prefilling" synchronously before the async reviews fetch starts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefilling(true);
    (async () => {
      const entries = await Promise.all(
        productIds.map(
          async pid => [pid, await fetchUserReview(pid, userId, moduleConfigId)] as const
        )
      );
      if (cancelled) return;
      setExistingReviews(new Map(entries));
      setPrefilling(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, orderId, userId, productIds, moduleConfigId]);

  if (!order) return <></>;

  // Defense-in-depth: reviews are only allowed for orders that were actually delivered.
  // The primary gate lives in OrdersList (`canReview`), this is a safety net for any future caller.
  if ((order.statusIdentifier ?? '').toLowerCase() !== ORDER_STATUSES.delivered) return <></>;

  const close = (): void => setTransition('close');
  const created = (order as unknown as { createdDate?: string }).createdDate;
  const statusLabel =
    (order.statusLocalizeInfos as { title?: string } | undefined)?.title ??
    order.statusIdentifier ??
    '';

  return (
    <DrawerAnimations component="OrderReviewPopup">
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-20 flex max-h-dvh w-full flex-col overflow-y-auto rounded-t-[20px] bg-ink/80 px-5 pt-5 pb-10 shadow-xl backdrop-blur-card md:top-1/2 md:right-auto md:bottom-auto md:left-1/2 md:h-auto md:max-h-[90vh] md:max-w-182 md:-translate-1/2 md:rounded-[20px] md:p-10"
      >
        <div className="flex items-center justify-between gap-5">
          <button
            type="button"
            onClick={close}
            aria-label={t('back_text', 'Back')}
            className="group flex items-center justify-center"
          >
            <ArrowBackIcon className="hover-target text-paper" />
          </button>
          <p className="text-2xl leading-7.5 font-bold text-brand">
            {t('leave_review', 'Leave a review')}
          </p>
          {/* Close lives in the bottom-menu on mobile (CenterCloseButton); show only md+. */}
          <ClosePopupButton
            onClose={close}
            ariaLabel="Close review form"
            className="max-md:hidden"
          />
          <span aria-hidden="true" className="size-11.5 md:hidden" />
        </div>

        {!isAuth ? (
          <div className="mt-7.5 rounded-xl bg-ink/60 p-6 text-center text-paper/90">
            {t('please_signin_review_text', 'Please sign in to leave a review.')}
          </div>
        ) : (
          <>
            <p className="mt-7.5 text-center text-xl font-normal text-paper">
              {t('please_leave_review_text', 'Please, leave a review!')}
            </p>

            <div className="mt-3.75 flex w-full items-center justify-between gap-2 rounded-card bg-custom_gray_pk px-3.75 py-1.5 text-sm text-white lg:text-base">
              <p className="font-bold">№{formatOrderNumber(order)}</p>
              <p className="capitalize">{statusLabel}</p>
              <p>{formatDate(created)}</p>
            </div>

            {prefilling ? (
              <div className="mt-3.75 text-paper/70">{t('loading_orders_text', 'Loading...')}</div>
            ) : (
              <div className="mt-3.75 flex flex-col gap-3.75">
                {order.products.map((p, idx) => (
                  <ReviewableItem
                    key={`${p.id}-${idx}`}
                    product={p}
                    fullProduct={productsById.get(p.id)}
                    initialReview={existingReviews.get(p.id) ?? null}
                    moduleConfigId={moduleConfigId}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <ModalBackdrop />
    </DrawerAnimations>
  );
};

export default OrderReviewPopup;
