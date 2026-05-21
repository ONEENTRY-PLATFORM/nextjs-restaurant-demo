'use client';

import dynamic from 'next/dynamic';
import { type JSX, useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

import { popupLoaders } from './popupRegistry';

const CartPopup = dynamic(popupLoaders.CartPopup);
const FavoritesPopup = dynamic(popupLoaders.FavoritesPopup);
const ProfilePopup = dynamic(popupLoaders.ProfilePopup);
const BookingsPopup = dynamic(popupLoaders.BookingsPopup);
const ReservationPopup = dynamic(popupLoaders.ReservationPopup);
const OrderReviewPopup = dynamic(popupLoaders.OrderReviewPopup);
const Modal = dynamic(popupLoaders.Modal);

// `Modal` hosts every form-based screen — listing them here keeps the lookup table
// in one place; any value not in DRAWER_COMPONENTS falls through to Modal as long
// as the drawer is open with a non-empty `component`.
const DRAWER_COMPONENTS = new Set([
  'CartPopup',
  'FavoritesPopup',
  'ProfilePopup',
  'BookingsPopup',
  'ReservationPopup',
  'OrderReviewPopup',
]);

/**
 * PopupRoot — gates every drawer / modal chunk behind actual usage.
 *
 * Replaces the `<CartPopup /> <FavoritesPopup /> …` blob in RootLayout: those
 * mounts triggered each popup's `dynamic()` chunk on initial page load even
 * while every popup returned `<></>` internally. PopupRoot subscribes to
 * `OpenDrawerContext` and renders the single active popup, so its chunk is
 * fetched only when the user opens it (or `prefetchPopup()` is called on hover).
 *
 * @returns JSX of the currently active popup, or `null` when nothing is open.
 */
const PopupRoot = (): JSX.Element | null => {
  const { open, component } = useContext(OpenDrawerContext);
  if (!open || !component) return null;

  if (component === 'CartPopup') return <CartPopup />;
  if (component === 'FavoritesPopup') return <FavoritesPopup />;
  if (component === 'ProfilePopup') return <ProfilePopup />;
  if (component === 'BookingsPopup') return <BookingsPopup />;
  if (component === 'ReservationPopup') return <ReservationPopup />;
  if (component === 'OrderReviewPopup') return <OrderReviewPopup />;
  // Forms (`SignInForm`, `CalendarForm`, etc.) are hosted by the shared Modal.
  if (!DRAWER_COMPONENTS.has(component)) return <Modal />;
  return null;
};

export default PopupRoot;
