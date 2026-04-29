/**
 * Static fallback for {@link OrderReviewsPanel} — mirrors the three review
 * lines hard-coded in `static-html/index_rewiews.html` (two product photos
 * + a courier line). Used when no real OneEntry order is matched by the
 * `?review_order=<id>` query param. Shape mirrors the trimmed order line
 * payload the panel consumes so swapping in a live order is a 1:1 change.
 */
export type OrderReviewLineMock = {
  id: string;
  /** Product id when the line is a dish; `null` for the courier/delivery line. */
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
