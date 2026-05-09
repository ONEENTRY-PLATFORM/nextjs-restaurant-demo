/**
 * Лимит карточек товаров на одну страницу каталога.
 * Применяется в `/shop`, `/shop/category/[handle]`, `/shop/[handle]`.
 * Берётся из `NEXT_PUBLIC_SHOP_PAGE_LIMIT` (.env / .env.local), по умолчанию 10.
 */
export const SHOP_PAGE_LIMIT: number = Number(process.env.NEXT_PUBLIC_SHOP_PAGE_LIMIT) || 10;

/**
 * id OneEntry-продукта, представляющего доставку.
 *
 * Используется как отдельная строка в итогах корзины (Delivery: $X), скрывается
 * из визуального списка товаров и добавляется в `orderProducts` при создании
 * заказа (см. `useCreateOrder`). Берётся из `NEXT_PUBLIC_DELIVERY_PRODUCT_ID`,
 * по умолчанию 33 — соответствует продукту "Delivery" в OneEntry-каталоге.
 */
export const DELIVERY_PRODUCT_ID: number =
  Number(process.env.NEXT_PUBLIC_DELIVERY_PRODUCT_ID) || 33;
