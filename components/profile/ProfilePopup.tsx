'use client';

import Link from 'next/link';
import { useTransitionRouter } from 'next-transition-router';
import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';
import { useContext, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import { logOutUser, useGetMenuByMarkerQuery } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ArrowBackIcon from '@/components/icons/arrow-back';
import ChevronMiniRightIcon from '@/components/icons/chevron-mini-right.svg';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import DrawerAnimations from '@/components/shared/animations/DrawerAnimations';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

import BookingsContent from './BookingsContent';
import FavoritesGrid from './FavoritesGrid';
import OrdersList from './OrdersList';
import ProfileSections from './ProfileSections';

const PROFILE_NAV_ITEM_CLASS =
  'group flex w-full items-center justify-between border-b border-muted/30 py-3.75 text-xl text-paper hover:text-brand';

const PROFILE_MENU_MARKER = 'user_menu';
const PROFILE_PAGE_URL = 'profile';

const MD_QUERY = '(min-width: 768px)';
/**
 * subscribeMd — `useSyncExternalStore` subscriber for the `md` (768px+) media query.
 *
 * @param   {() => void}   cb - Change listener triggered whenever the match state flips.
 * @returns Unsubscribe function.
 */
const subscribeMd = (cb: () => void): (() => void) => {
  const mq = window.matchMedia(MD_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
/**
 * getMdSnapshot — current client snapshot of the `md` media query match state.
 *
 * @returns `true` when the viewport currently matches `md` (>= 768px).
 */
const getMdSnapshot = (): boolean => window.matchMedia(MD_QUERY).matches;
/**
 * getMdServerSnapshot — server snapshot for the `md` media query (always `false`).
 *
 * @returns Always `false` so SSR renders the mobile layout deterministically.
 */
const getMdServerSnapshot = (): boolean => false;
/**
 * useIsMdUp — `useSyncExternalStore` hook returning whether the viewport is md+ (`min-width: 768px`).
 *
 * @returns `true` on md+ viewports, `false` otherwise (server snapshot is `false`).
 */
const useIsMdUp = (): boolean =>
  useSyncExternalStore(subscribeMd, getMdSnapshot, getMdServerSnapshot);

type ProfileScreen = 'menu' | 'orders' | 'favorites' | 'bookings' | 'personal';

const MOBILE_INLINE_SCREENS: Record<string, ProfileScreen> = {
  orders: 'orders',
  favorites: 'favorites',
  bookings: 'bookings',
};

/**
 * ProfileNavMenu — list of profile links from the CMS menu `user_menu` (children of `profile`).
 *
 * @param   {object}                                props                - Component props.
 * @param   {boolean}                               props.isMdUp         - When `true`, links navigate to standalone routes; otherwise mobile inline screens are used.
 * @param   {() => void}                            props.onNavigate     - Called after a navigation link is clicked (closes the popup).
 * @param   {(screen: ProfileScreen) => void}       props.onSelectScreen - Switches the inline mobile screen.
 * @returns JSX of the navigation list, or `null` when no menu items are configured.
 */
const ProfileNavMenu = ({
  isMdUp,
  onNavigate,
  onSelectScreen,
}: {
  isMdUp: boolean;
  onNavigate: () => void;
  onSelectScreen: (screen: ProfileScreen) => void;
}): JSX.Element | null => {
  const { isAuth, authenticate } = useContext(AuthContext);
  const router = useTransitionRouter();
  const { data: menu } = useGetMenuByMarkerQuery(
    { marker: PROFILE_MENU_MARKER },
    { skip: !isAuth }
  );

  const profileChildren = useMemo<IMenusPages[]>(() => {
    const pages = menu?.pages ?? [];
    const profileEntry = pages.find(p => p.pageUrl === PROFILE_PAGE_URL);
    if (!profileEntry) return [];
    return pages
      .filter(p => p.parentId === profileEntry.id)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [menu]);

  if (profileChildren.length === 0) return null;

  const handleLogout = async () => {
    try {
      await logOutUser({ marker: 'email' });
      authenticate();
      onNavigate();
      router.push('/');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav aria-label="Profile menu" className="flex flex-col">
      {profileChildren.map(page => {
        const label = page.localizeInfos?.menuTitle || page.localizeInfos?.title || page.pageUrl;
        const inlineScreen = page.pageUrl ? MOBILE_INLINE_SCREENS[page.pageUrl] : undefined;

        // Mobile inline screen - the button switches `screen` inside the popup.
        if (!isMdUp && inlineScreen) {
          return (
            <button
              key={page.id}
              type="button"
              onClick={() => onSelectScreen(inlineScreen)}
              className={PROFILE_NAV_ITEM_CLASS}
            >
              <span>{label}</span>
              <ChevronMiniRightIcon className="hover-target" />
            </button>
          );
        }

        // Default (md+ or unknown pageUrl) - link to standalone `/profile/{pageUrl}` that closes the popup.
        return (
          <Link
            key={page.id}
            href={`/${PROFILE_PAGE_URL}/${page.pageUrl}`}
            onClick={onNavigate}
            className={PROFILE_NAV_ITEM_CLASS}
          >
            <span>{label}</span>
            <ChevronMiniRightIcon className="hover-target" />
          </Link>
        );
      })}
      {!isMdUp && (
        <button
          type="button"
          onClick={() => onSelectScreen('personal')}
          className={PROFILE_NAV_ITEM_CLASS}
        >
          <span>My Profile</span>
          <ChevronMiniRightIcon className="hover-target" />
        </button>
      )}
      <button type="button" onClick={handleLogout} className={PROFILE_NAV_ITEM_CLASS}>
        <span>Logout</span>
        <ChevronMiniRightIcon className="hover-target" />
      </button>
    </nav>
  );
};

const SCREEN_TITLES: Record<Exclude<ProfileScreen, 'menu'>, string> = {
  orders: 'Orders',
  favorites: 'Favorites',
  bookings: 'Bookings',
  personal: 'My Profile',
};

/**
 * ScreenHeader — mobile sub-screen header (back arrow + screen title).
 *
 * @param   {object}                            props        - Component props.
 * @param   {Exclude<ProfileScreen, 'menu'>}    props.screen - Active sub-screen identifier (`orders` | `favorites` | `bookings` | `personal`).
 * @param   {() => void}                        props.onBack - Called when the back arrow is clicked.
 * @returns JSX of the sub-screen header.
 */
const ScreenHeader = ({
  screen,
  onBack,
}: {
  screen: Exclude<ProfileScreen, 'menu'>;
  onBack: () => void;
}): JSX.Element => (
  <div className="mb-5 flex items-center justify-between gap-5">
    <button
      type="button"
      onClick={onBack}
      aria-label="Back to menu"
      className="group flex items-center justify-center"
    >
      <ArrowBackIcon className="hover-target text-paper" />
    </button>
    <p className="font-semibold text-2xl text-brand">{SCREEN_TITLES[screen]}</p>
    <span className="size-7" aria-hidden="true" />
  </div>
);

/**
 * ProfilePopup — profile drawer (slide-up on mobile, side panel on md+).
 *
 * @returns JSX of the profile drawer (or empty fragment when not active).
 */
const ProfilePopup = (): JSX.Element => {
  const { open, component, setOpen, setTransition } = useContext(OpenDrawerContext);
  const isOpen = open && component === 'ProfilePopup';
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const isMdUp = useIsMdUp();
  const [screen, setScreen] = useState<ProfileScreen>('menu');

  useSwipeToClose(sheetRef, () => {
    setScreen('menu');
    setOpen(false);
  });

  const close = () => {
    setScreen('menu');
    setTransition('close');
  };

  if (!isOpen) {
    return <></>;
  }

  // On desktop always show the menu.
  const activeScreen = isMdUp ? 'menu' : screen;

  return (
    <DrawerAnimations component="ProfilePopup" variant="slide-up-right">
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed bottom-0 top-0 left-0 right-0 z-20 h-dvh overflow-y-auto rounded-t-[20px] bg-ink/80 px-5 pt-7.25 backdrop-blur-card shadow-xl md:bottom-auto md:left-auto md:right-0 md:top-37.5 md:h-auto md:max-h-screen md:max-w-100 md:rounded-l-[20px] md:rounded-tr-none md:pb-7.25 lg:top-37.5 xl:top-46.25"
      >
        <div className="hidden w-full md:flex justify-end">
          <button
            type="button"
            onClick={close}
            aria-label="Close profile"
            className="z-10 -mt-2.5 size-12 items-center justify-center rounded-full border border-solid border-paper/40 bg-transparent text-lg text-paper transition-colors hover:border-brand hover:text-brand md:flex md:size-10 lg:size-12.5 lg:p-2.5"
          >
            &#10005;
          </button>
        </div>

        <div className="mx-auto h-full max-w-87.5 overflow-x-hidden overflow-y-auto pb-25 no-scrollbar md:pb-0">
          <div
            key={activeScreen}
            className={
              'mt-5 md:mt-0 ' +
              (activeScreen === 'menu' ? 'profile-screen-enter-left' : 'profile-screen-enter-right')
            }
          >
            {activeScreen === 'menu' ? (
              <>
                {isMdUp && (
                  <div className="mb-7.5">
                    <ProfileSections />
                  </div>
                )}
                <ProfileNavMenu isMdUp={isMdUp} onNavigate={close} onSelectScreen={setScreen} />
              </>
            ) : (
              <>
                <ScreenHeader screen={activeScreen} onBack={() => setScreen('menu')} />
                {activeScreen === 'orders' && <OrdersList />}
                {activeScreen === 'favorites' && <FavoritesGrid />}
                {activeScreen === 'bookings' && <BookingsContent />}
                {activeScreen === 'personal' && <ProfileSections />}
              </>
            )}
          </div>
          <div className="h-25 bg-transparent md:hidden" />
        </div>
      </div>
      <ModalBackdrop />
    </DrawerAnimations>
  );
};

export default ProfilePopup;
