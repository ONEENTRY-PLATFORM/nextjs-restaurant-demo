/**
 * Статический fallback для {@link OrderReviewsPanel} — повторяет три строки
 * отзывов, захардкоженные в `static-html/index_rewiews.html` (две фотографии
 * продуктов + строка курьера). Используется, когда ни один реальный заказ
 * OneEntry не сматчился по query-параметру `?review_order=<id>`. Форма
 * повторяет урезанный payload позиции заказа, который потребляет панель,
 * так что замена на живой заказ — 1:1.
 */
export type OrderReviewLineMock = {
  id: string;
  /** Product id, когда строка — блюдо; `null` для строки курьера/доставки. */
  productId: number | null;
  title: string;
  imageSrc: string;
  isDelivery?: boolean;
};

export type OrderReviewMock = {
  orderNumber: string;
  status: string;
  date: string;
  lines: OrderReviewLineMock[];
};

export const mockOrderReview: OrderReviewMock = {
  orderNumber: 'OE230307-894230',
  status: 'In delivery',
  date: '27.02.24',
  lines: [
    {
      id: 'mock-1',
      productId: null,
      title: 'Pancakes with honey and berries',
      imageSrc: '/images/picture/favorites1.png',
    },
    {
      id: 'mock-2',
      productId: null,
      title: 'Greek salad with olives',
      imageSrc: '/images/picture/favorites2.png',
    },
    {
      id: 'mock-delivery',
      productId: null,
      title: 'Delivery',
      imageSrc: '/images/icons/delivery.svg',
      isDelivery: true,
    },
  ],
};
