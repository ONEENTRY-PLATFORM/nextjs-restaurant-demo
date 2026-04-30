'use client';

import { type JSX, useContext, useSyncExternalStore } from 'react';

import { useAppSelector } from '@/app/store/hooks';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { selectFavoritesItems } from '@/app/store/reducers/FavoritesSlice';
import FavoritesIcon from '@/components/icons/favorites';

/**
 * Кнопка nav-элемента избранного — десктопный триггер в header, открывает
 * `FavoritesPopup` (центрированная модалка — порт `static-html/pk_favorites.html`).
 * Зеркалит мобильный триггер из bottom-меню, чтобы избранное было попапом на
 * всех брейкпоинтах. Страница `/profile/favorites` остаётся как fallback-route.
 * @returns {JSX.Element} JSX кнопки избранного.
 */
const NavItemFavorites = (): JSX.Element => {
  const { setOpen, setComponent } = useContext(OpenDrawerContext);
  const items = useAppSelector(selectFavoritesItems);
  const count = items?.length ?? 0;
  // Persisted-слайс регидратится на клиенте — гейтим бейдж, чтобы избежать
  // расхождения серверной/клиентской разметки (тот же трюк, что в NavItemCart).
  const mounted = useSyncExternalStore(
    (cb) => {
      cb();
      return () => {};
    },
    () => true,
    () => false,
  );

  return (
    <button
      type="button"
      onClick={() => {
        setComponent('FavoritesPopup');
        setOpen(true);
      }}
      aria-label="Favorites"
      className="group relative my-auto box-border flex shrink-0"
    >
      <FavoritesIcon />
      {mounted && count > 0 && (
        <div className="py-0.5 px-1.25 absolute -top-0.75 -right-1.75 rounded-full bg-brand">
          <p className="font-bold text-[8px] text-black">{count}</p>
        </div>
      )}
    </button>
  );
};

export default NavItemFavorites;
