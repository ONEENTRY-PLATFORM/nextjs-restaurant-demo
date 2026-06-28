'use client';

import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { IUserEntity } from 'oneentry/dist/users/usersInterfaces';
import { type JSX, useContext, useSyncExternalStore } from 'react';
import { toast } from 'react-toastify';

import { onSubscribeEvents, onUnsubscribeEvents } from '@/app/api/hooks/useEvents';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import {
  addFavorites,
  removeFavorites,
  selectIsFavorites,
} from '@/app/store/reducers/FavoritesSlice';
import HeartCardIcon from '@/components/icons/heart-card';

/**
 * HeartCardButton — toggles a product in the favorites store.
 *
 * @param   {object}            props         - Component props.
 * @param   {IProductsEntity}   props.product - Product entity to toggle in favorites.
 * @returns JSX of the heart toggle button.
 */
const HeartCardButton = ({ product }: { product: IProductsEntity }): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  const { user, isAuth } = useContext(AuthContext);
  const isFavStored = useAppSelector(state => selectIsFavorites(state, product.id));
  // useSyncExternalStore — so the server snapshot is `false` and the client after mount
  // switches to the actual persisted value from localStorage without a hydration mismatch.
  const hydrated = useSyncExternalStore(
    cb => {
      cb();
      return () => {};
    },
    () => true,
    () => false
  );
  const isFav = hydrated && isFavStored;

  const title = product.localizeInfos?.title ?? '';
  const titleSlot = (template: string) => template.replace('{title}', title);
  const addedToast = (): string =>
    titleSlot(t('product_added_favorites_toast', 'Product {title} added to Favorites!'));
  const removedToast = (): string =>
    titleSlot(t('product_removed_favorites_toast', 'Product {title} removed from Favorites!'));

  const toggleLocal = (): void => {
    if (isFav) {
      dispatch(removeFavorites(product.id));
      toast(removedToast());
    } else {
      dispatch(addFavorites(product.id));
      toast(addedToast());
    }
  };

  const toggleAuthed = async (): Promise<void> => {
    try {
      if (!isFav) {
        dispatch(addFavorites(product.id));
        await onSubscribeEvents(product.id);
        toast(addedToast());
      } else {
        dispatch(removeFavorites(product.id));
        await onUnsubscribeEvents(product.id);
        toast(removedToast());
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      toast(t('auth_error_prefix', 'Auth error!') + ' ' + message);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    if (user && isAuth && (user as IUserEntity).id) {
      void toggleAuthed();
    } else {
      toggleLocal();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        isFav
          ? t('remove_from_favorites_label', 'Remove from favorites')
          : t('add_to_favorites_label', 'Add to favorites')
      }
      aria-pressed={isFav}
      className="absolute top-3.75 right-2.5 z-10 cursor-pointer border-0 bg-transparent p-0 md:top-5 md:right-3.75"
    >
      <HeartCardIcon
        filled={isFav}
        className="h-5.25 w-6.5 transition-colors duration-200 hover:fill-white focus:fill-white md:h-7.5 md:w-9.5"
      />
    </button>
  );
};

export default HeartCardButton;
