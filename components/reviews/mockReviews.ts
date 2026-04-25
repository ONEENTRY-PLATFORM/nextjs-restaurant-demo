export type ProductReview = {
  id: string;
  author: string;
  date: string;
  rating: number;
  text: string;
};

/**
 * Mock reviews list — мирроринг блока отзывов из `static-html/details.html`.
 * Заменить на реальный fetch, когда в OneEntry появится коллекция отзывов
 * (см. `ONEENTRY-ADMIN-SETUP.md` §2.1 `review`).
 */
export const mockProductReviews: ProductReview[] = [
  {
    id: '1',
    author: 'Robert F.',
    date: '27.01.24, 15.04',
    rating: 5,
    text: "The developers' and CMS users' vast, unique experience became the basis of HeadlessCMS OneEntry. We know what the users want, so we took into account the needs of business owners",
  },
  {
    id: '2',
    author: 'Anna M.',
    date: '27.01.24, 15.04',
    rating: 4,
    text: 'Tempor sed felis aliquet eu augue urna tellus pulvinar. Eu consectetur pulvinar turpis enim nisi.',
  },
  {
    id: '3',
    author: 'Alya G.',
    date: '27.01.24, 15.04',
    rating: 4,
    text: 'Lorem ipsum dolor sit amet consectetur. Feugiat fermentum ornare eleifend nec. Nam malesuada faucibus volutpat euismod proin porttitor mattis egestas dui. Non turpis gravida nisl ultrices id est. Pulvinar integer vitae ultricies.',
  },
];
