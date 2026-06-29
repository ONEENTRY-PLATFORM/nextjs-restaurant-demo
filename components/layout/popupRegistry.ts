type PopupLoader = () => Promise<unknown>;

/**
 * popupLoaders — single source of truth for the dynamic-import callsites
 * of every drawer / modal chunk.
 *
 * Used both by {@link PopupRoot} (to mount the active popup) and by
 * {@link prefetchPopup} (to warm the chunk on hover/focus). The bundler
 * deduplicates by module path, so calling the same loader twice still
 * fetches the chunk once.
 */
export const popupLoaders = {
  CartPopup: () => import('@/components/cart/CartPopup'),
  FavoritesPopup: () => import('@/components/profile/favorites/FavoritesPopup'),
  ProfilePopup: () => import('@/components/profile/ProfilePopup'),
  BookingsPopup: () => import('@/components/profile/bookings/BookingsPopup'),
  ReservationPopup: () => import('@/components/reservation/ReservationPopup'),
  OrderReviewPopup: () => import('@/components/profile/OrderReviewPopup'),
  Modal: () => import('@/components/layout/modal'),
} as const satisfies Record<string, PopupLoader>;

export type PopupName = keyof typeof popupLoaders;

// Drawer-style popups have their own chunk; everything else is a form rendered
// inside the shared `Modal`, so prefetching any form name warms the Modal chunk.
const DRAWER_POPUPS = new Set<string>([
  'CartPopup',
  'FavoritesPopup',
  'ProfilePopup',
  'BookingsPopup',
  'ReservationPopup',
  'OrderReviewPopup',
]);

const prefetched = new Set<string>();

/**
 * prefetchPopup — fires the dynamic `import()` of a popup's chunk so it lands
 * in the browser cache before the user actually opens it.
 *
 * Idempotent: subsequent calls for the same name are no-ops. Safe to wire to
 * `onPointerEnter` / `onFocus` of any trigger button.
 *
 * @param   {string} name - Drawer name (`'CartPopup'`, …) or form name (`'SignInForm'`, …).
 * @returns
 */
export const prefetchPopup = (name: string): void => {
  if (!name || prefetched.has(name)) return;
  const target = DRAWER_POPUPS.has(name) ? (name as PopupName) : 'Modal';
  if (prefetched.has(target)) {
    prefetched.add(name);
    return;
  }
  prefetched.add(name);
  prefetched.add(target);
  // Fire-and-forget; failure is non-fatal — the actual mount in PopupRoot will
  // retry through `dynamic()`'s own error path.
  popupLoaders[target]().catch(() => {
    prefetched.delete(name);
    prefetched.delete(target);
  });
};
