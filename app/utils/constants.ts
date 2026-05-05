/**
 * Лимит карточек товаров на одну страницу каталога.
 * Применяется в `/shop`, `/shop/category/[handle]`, `/shop/[handle]`.
 * Берётся из `NEXT_PUBLIC_SHOP_PAGE_LIMIT` (.env / .env.local), по умолчанию 10.
 */
export const SHOP_PAGE_LIMIT: number = Number(process.env.NEXT_PUBLIC_SHOP_PAGE_LIMIT) || 10;
