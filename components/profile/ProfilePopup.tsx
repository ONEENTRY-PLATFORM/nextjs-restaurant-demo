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
import ClosePopupButton from '@/components/shared/ClosePopupButton';
import { useSwipeToClose } from '@/components/shared/useSwipeToClose';

import ProfilePopupAnimations from './animations/ProfilePopupAnimations';
import BookingsContent from './BookingsContent';
import FavoritesGrid from './FavoritesGrid';
import OrdersList from './OrdersList';
import ProfileSections from './ProfileSections';

const PROFILE_NAV_ITEM_CLASS =
  'group flex w-full items-center justify-between border-b border-muted/30 py-3.75 text-xl text-paper hover:text-brand';

const PROFILE_MENU_MARKER = 'user_menu';
const PROFILE_PAGE_URL = 'profile';

// Тот же breakpoint-helper, что в CartWizard / OrdersList: на md+ ссылки в
// меню профиля ведут на отдельные страницы `/profile/{pageUrl}`, на мобиле —
// переключаются как экраны внутри попапа (паттерн CartWizard).
const MD_QUERY = '(min-width: 768px)';
const subscribeMd = (cb: () => void): (() => void) => {
  const mq = window.matchMedia(MD_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getMdSnapshot = (): boolean => window.matchMedia(MD_QUERY).matches;
const getMdServerSnapshot = (): boolean => false;
const useIsMdUp = (): boolean =>
  useSyncExternalStore(subscribeMd, getMdSnapshot, getMdServerSnapshot);

type ProfileScreen = 'menu' | 'orders' | 'favorites' | 'bookings' | 'personal';

// Маркеры pageUrl, которые на мобильном остаются внутри попапа (соответствуют
// сабэкранам ProfileScreen). Прочие CMS-пункты — fallback-навигация по Link.
const MOBILE_INLINE_SCREENS: Record<string, ProfileScreen> = {
  orders: 'orders',
  favorites: 'favorites',
  bookings: 'bookings',
};

/**
 * Список ссылок личного кабинета (Orders / Favorites / Bookings / …)
 * из CMS-меню `user_menu` — children пункта `profile`. Тот же источник, что
 * у hover-дропдауна десктопного {@link import('@/components/layout/header/nav/NavItemProfile').default}.
 *
 * - На md+ каждый пункт — `Link` на `/profile/{pageUrl}` (десктоп
 *   использует полноценные страницы). Спец-кейс `bookings` — открывает
 *   {@link import('./BookingsPopup').default} через `setComponent`,
 *   потому что отдельной страницы `/profile/bookings` нет.
 * - На мобиле клик переключает экран внутри попапа (`setScreen`),
 *   попап остаётся открытым, контент свопается — повторяет паттерн
 *   {@link import('@/components/cart/CartWizard').default}.
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
  const { setComponent } = useContext(OpenDrawerContext);
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

        // Мобильный inline-экран — кнопка переключает screen внутри попапа.
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

        // bookings на десктопе и при отсутствии inline-экрана для мобилы —
        // открываем отдельный попап BookingsPopup через OpenDrawerContext
        // (страницы `/profile/bookings` нет — bookings живут только overlay'ем).
        if (page.pageUrl === 'bookings') {
          return (
            <button
              key={page.id}
              type="button"
              onClick={() => setComponent('BookingsPopup')}
              className={PROFILE_NAV_ITEM_CLASS}
            >
              <span>{label}</span>
              <ChevronMiniRightIcon className="hover-target" />
            </button>
          );
        }

        // Дефолт — md+ или незнакомые pageUrl: ссылка на отдельную
        // страницу `/profile/{pageUrl}` с закрытием попапа.
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
 * Шапка под-экрана: стрелка назад → меню, заголовок по центру.
 * Используется на мобильном при screen !== 'menu'. Стиль повторяет
 * шапку {@link import('@/components/profile/BookingsPopup').default}.
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
    <p className="font-semibold text-[24px] text-brand">{SCREEN_TITLES[screen]}</p>
    <span className="size-7" aria-hidden="true" />
  </div>
);

/**
 * Drawer-попап профиля. На md+ — drawer с навигационным меню (ссылки на
 * страницы `/profile/{pageUrl}`) + секции My Profile / Address. На мобиле
 * добавляется screen-swap внутри попапа: клик по Orders/Favorites/Bookings
 * не закрывает попап, а свапит контент (паттерн `CartWizard`); сверху
 * появляется шапка с кнопкой «back» — возврат к меню.
 * @returns {JSX.Element} JSX drawer-а профиля.
 */
const ProfilePopup = (): JSX.Element => {
  const { open, component, setOpen, setTransition } = useContext(OpenDrawerContext);
  const isOpen = open && component === 'ProfilePopup';
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const isMdUp = useIsMdUp();
  const [screen, setScreen] = useState<ProfileScreen>('menu');

  // Свайп вниз закрывает напрямую — минуем GSAP-reverse, чтобы
  // inline-transform от хука не перебивался `yPercent`-tween-ом.
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

  // На десктопе всегда показываем меню + Personal/Address (screen-state
  // игнорируется — все ссылки ведут на отдельные страницы).
  const activeScreen = isMdUp ? 'menu' : screen;

  return (
    <ProfilePopupAnimations>
      <div
        id="modalBody"
        ref={sheetRef}
        className="fixed bottom-0 top-0 left-0 right-0 z-20 h-dvh overflow-y-auto rounded-t-[20px] bg-ink/80 px-5 pt-7.25 backdrop-blur-[10px] shadow-xl md:bottom-auto md:left-auto md:right-0 md:top-37.5 md:h-auto md:max-h-screen md:max-w-100 md:rounded-l-[20px] md:rounded-tr-none md:pb-7.25 lg:top-37.5 xl:top-46.25"
      >
        <div className="hidden w-full md:flex justify-end">
          <ClosePopupButton
            onClose={close}
            ariaLabel="Close profile"
            className="hidden -mt-2.5 md:flex"
          />
        </div>

        <div className="mx-auto h-full max-w-87.5 overflow-x-hidden overflow-y-auto pb-25 no-scrollbar md:pb-0">
          {/* Анимация drill-down: forward (menu → screen) — въезд справа,
              back — въезд слева. `key={activeScreen}` перемонтирует блок,
              чтобы CSS-keyframes запускались на каждом переходе. На десктопе
              activeScreen всегда 'menu', анимация играется один раз при
              маунте попапа — это допустимо. */}
          <div
            key={activeScreen}
            className={
              'mt-5 md:mt-0 ' +
              (activeScreen === 'menu' ? 'profile-screen-enter-left' : 'profile-screen-enter-right')
            }
          >
            {activeScreen === 'menu' ? (
              <>
                <ProfileNavMenu isMdUp={isMdUp} onNavigate={close} onSelectScreen={setScreen} />
                {/* На десктопе ProfileSections (My Profile + Address) рендерятся
                    инлайн под навигацией — десктоп не использует sub-screen swap.
                    На мобильном "My Profile" — отдельный пункт меню, открывающий
                    свой экран `personal`, поэтому инлайн-блок не нужен. */}
                {isMdUp && (
                  <div className="mt-7.5">
                    <ProfileSections />
                  </div>
                )}
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
    </ProfilePopupAnimations>
  );
};

export default ProfilePopup;
