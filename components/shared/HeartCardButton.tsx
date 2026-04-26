'use client';

import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { IUserEntity } from 'oneentry/dist/users/usersInterfaces';
import { type JSX, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import {
  onSubscribeEvents,
  onUnsubscribeEvents,
} from '@/app/api/hooks/useEvents';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import {
  addFavorites,
  removeFavorites,
  selectIsFavorites,
} from '@/app/store/reducers/FavoritesSlice';
import HeartCardIcon from '@/components/icons/heart-card';

/**
 * HeartCardButton — toggles a product in the favorites store.
 * Uses the same `heart_card` SVG from verstka so the card visual is 1:1
 * with `static-html/index.html`. Filled stroke when favorited.
 *
 * Layered above the absolute click-through `<Link>` overlay in ProductCard
 * via z-index so clicking the heart doesn't navigate.
 * @param   {object}          props         - Component props.
 * @param   {IProductsEntity} props.product - Product to toggle.
 * @returns {JSX.Element}                   Heart button JSX.
 */
const HeartCardButton = ({
  product,
}: {
  product: IProductsEntity;
}): JSX.Element => {
  const dispatch = useAppDispatch();
  const { user, isAuth } = useContext(AuthContext);
  const isFavStored = useAppSelector((state) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectIsFavorites(state as any, product.id),
  );
  // Favorites are restored from localStorage on the client after hydration,
  // so SSR sees `false` while the client may see `true` — render the empty
  // state until mount to keep the first client paint consistent with SSR.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  const isFav = hydrated && isFavStored;

  const title = product.localizeInfos?.title ?? '';

  const toggleLocal = (): void => {
    if (isFav) {
      dispatch(removeFavorites(product.id));
      toast('Product ' + title + ' removed from Favorites!');
    } else {
      dispatch(addFavorites(product.id));
      toast('Product ' + title + ' added to Favorites!');
    }
  };

  const toggleAuthed = async (): Promise<void> => {
    try {
      if (!isFav) {
        dispatch(addFavorites(product.id));
        await onSubscribeEvents(product.id);
        toast('Product ' + title + ' added to Favorites!');
      } else {
        dispatch(removeFavorites(product.id));
        await onUnsubscribeEvents(product.id);
        toast('Product ' + title + ' removed from Favorites!');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast('Auth error! ' + e?.message);
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
      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isFav}
      className="absolute top-3.75 md:top-5 right-2.5 md:right-3.75 z-10 bg-transparent border-0 p-0 cursor-pointer"
    >
      <HeartCardIcon
        filled={isFav}
        className="w-6.5 h-5.25 md:w-9.5 md:h-7.5 transition-colors duration-200 hover:fill-white focus:fill-white"
      />
    </button>
  );
};

export default HeartCardButton;
