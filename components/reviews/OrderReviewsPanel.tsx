'use client';

import Image from 'next/image';
import type { JSX } from 'react';
import { useContext, useState } from 'react';

import { submitDeliveryReview, submitReview } from '@/app/actions/review';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ChatDotsIcon from '@/components/icons/chat-dots.svg';
import ChevronUpIcon from '@/components/icons/chevron-up.svg';

import { mockOrderReview, type OrderReviewMock } from './mockOrderReviewData';
import StarRating from './StarRating';

/**
 * Форма, которую потребляет {@link OrderReviewsPanel}. Повторяет урезанную
 * проекцию `IOrderByMarkerEntity` (номер/статус/дата) плюс данные отзывов по строкам.
 */
export type OrderReviewsPanelProps = {
  /**
   * Проекция реального CMS-заказа. Когда не передана (или без строк), панель
   * использует fallback на {@link mockOrderReview}, чтобы UI никогда не был
   * пустым — соответствует правилу 2 из CLAUDE.md (моки должны визуально
   * совпадать с вёрсткой, пока данные OneEntry не подключены).
   */
  order?: OrderReviewMock | null;
};

/**
 * Состояние формы отзыва для каждой строки. У каждой позиции заказа свой
 * жизненный цикл рейтинга / текста / отправки, чтобы пользователь мог
 * отправить или отредактировать один отзыв, не затронув остальные.
 */
type LineState = {
  rating: number;
  text: string;
  loading: boolean;
  applied: boolean;
  error: string;
};

const initialLineState = (): LineState => ({
  rating: 0,
  text: '',
  loading: false,
  applied: false,
  error: '',
});

/**
 * Фиксированная нижняя панель "оставить отзывы" — повторяет drawer из
 * `index_rewiews.html`, который появляется над главной страницей после
 * доставки заказа. Видна только на мобиле (`md:hidden`).
 *
 * Каждая строка заказа рендерится как: фото + 5-звёздный рейтинг + поле
 * отзыва + кнопки Apply/Edit. Строка курьера отправляется через
 * {@link submitDeliveryReview} (placeholder, пока `delivery_review_form`
 * не появится в OneEntry — см. `ONEENTRY-ADMIN-SETUP.md` §1.3); строки
 * продуктов отправляются через {@link submitReview} с `productId` строки.
 *
 * Идентификация автора проходит через {@link AuthContext}; неавторизованный
 * посетитель видит глобальную модалку входа через {@link OpenDrawerContext}
 * вместо тихого отказа формы.
 * @param   {OrderReviewsPanelProps} props - Пропсы компонента.
 * @returns {JSX.Element}                   JSX панели.
 */
const OrderReviewsPanel = ({ order }: OrderReviewsPanelProps): JSX.Element => {
  const data: OrderReviewMock =
    order && order.lines.length > 0 ? order : mockOrderReview;

  const { isAuth } = useContext(AuthContext);
  const { open, setOpen, setComponent } = useContext(OpenDrawerContext);

  const [lineStates, setLineStates] = useState<Record<string, LineState>>(() =>
    Object.fromEntries(data.lines.map((l) => [l.id, initialLineState()])),
  );

  const updateLine = (id: string, patch: Partial<LineState>) => {
    setLineStates((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? initialLineState()), ...patch },
    }));
  };

  const onApply = async (lineId: string) => {
    if (!isAuth) {
      setComponent('SignInForm');
      setOpen(!open);
      return;
    }
    const line = data.lines.find((l) => l.id === lineId);
    if (!line) return;
    const state = lineStates[lineId] ?? initialLineState();
    if (!state.text.trim()) {
      updateLine(lineId, { error: 'Please write a review.' });
      return;
    }
    updateLine(lineId, { loading: true, error: '' });

    const res = line.isDelivery
      ? await submitDeliveryReview({
          rating: state.rating || 5,
          text: state.text.trim(),
          orderId: data.orderNumber,
        })
      : line.productId
        ? await submitReview({
            rating: state.rating || 5,
            text: state.text.trim(),
            productId: line.productId,
          })
        : { ok: false as const, message: 'Missing product id' };

    if (res.ok) {
      updateLine(lineId, { loading: false, applied: true, error: '' });
    } else {
      updateLine(lineId, { loading: false, error: res.message });
    }
  };

  const onEdit = (lineId: string) => {
    setLineStates((prev) => ({ ...prev, [lineId]: initialLineState() }));
  };

  return (
    <div className="animate-slide-up fixed bottom-0 left-0 z-10 w-full rounded-tl-[20px] rounded-tr-[20px] bg-[rgba(76,77,86,0.8)] px-5 pt-5.5 backdrop-blur-[10px] md:hidden">
      <div className="mx-auto max-w-88.75">
        <div className="flex items-center justify-center gap-1.25">
          <p className="text-center font-bold text-[20px] text-brand">
            Reviews
          </p>
          <ChatDotsIcon />
        </div>
        <p className="mt-5 font-normal text-base text-paper">
          Please, leave a review!
        </p>
        <div className="mt-2.75 flex items-center justify-between rounded-[5px] bg-custom_gray px-2.5 py-1.5 text-sm text-[#4c4d56]">
          <p className="font-bold">№{data.orderNumber}</p>
          <p>{data.status}</p>
          <p>{data.date}</p>
          <ChevronUpIcon />
        </div>

        <div className="mt-3.25 flex flex-col gap-4">
          {data.lines.map((line) => {
            const state = lineStates[line.id] ?? initialLineState();
            return (
              <div key={line.id} className="flex flex-col">
                <div className="flex justify-start gap-3.75">
                  <Image
                    src={line.imageSrc}
                    alt={line.title}
                    width={69}
                    height={69}
                    className="h-17.25 w-17.25 shrink-0 object-cover"
                  />
                  <div className="flex w-full flex-col justify-between">
                    <StarRating
                      value={state.rating}
                      {...(state.applied
                        ? {}
                        : {
                            onChange: (v: number) =>
                              updateLine(line.id, { rating: v }),
                          })}
                      size={14}
                    />
                    <input
                      value={state.text}
                      onChange={(e) =>
                        updateLine(line.id, { text: e.currentTarget.value })
                      }
                      disabled={state.applied || state.loading}
                      placeholder={state.applied ? 'Thanks!' : 'Review'}
                      className="ml-1.25 w-full min-w-63.75 rounded-[5px] border border-paper bg-transparent px-3.5 py-2.5 text-paper placeholder-paper/60 focus:border-brand focus:outline-none disabled:opacity-60"
                    />
                  </div>
                </div>
                <div className="mt-3.75 flex justify-center gap-5">
                  <button
                    type="button"
                    onClick={() => onApply(line.id)}
                    disabled={state.loading || state.applied}
                    className="hover_btn_white w-20 rounded-[5px] border border-brand py-1.25 text-brand disabled:opacity-60"
                  >
                    {!isAuth
                      ? 'Sign in'
                      : state.applied
                        ? 'Sent'
                        : state.loading
                          ? '...'
                          : 'Apply'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(line.id)}
                    className="hover_btn_white w-20 rounded-[5px] border border-paper py-1.25 text-paper"
                  >
                    Edit
                  </button>
                </div>
                {state.error ? (
                  <p className="mt-1.5 text-center text-sm text-red-400">
                    {state.error}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <div className="h-25 border-none bg-transparent"></div>
    </div>
  );
};

export default OrderReviewsPanel;
