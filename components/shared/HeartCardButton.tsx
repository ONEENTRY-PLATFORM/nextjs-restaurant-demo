'use client';

import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { IUserEntity } from 'oneentry/dist/users/usersInterfaces';
import { type JSX, useContext } from 'react';
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
  const isFav = useAppSelector((state) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectIsFavorites(state as any, product.id),
  );

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
      <svg
        className="w-6.5 h-5.25 md:w-9.5 md:h-7.5 transition-colors duration-200 hover:fill-white focus:fill-white"
        viewBox="0 0 38 30"
        fill={isFav ? 'white' : 'none'}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18.4662 4.60952L19.03 5.39613L19.5938 4.60952C21.2125 2.35111 23.9899 0.968939 27.2432 0.968831C29.6849 0.97161 32.0184 1.88902 33.7335 3.50839C35.4474 5.12657 36.4035 7.31176 36.4063 9.58205C36.4059 13.7939 33.6184 18.3289 27.778 23.0479C25.1122 25.1926 22.2324 27.089 19.1785 28.7105C19.1345 28.732 19.0834 28.7443 19.03 28.7443C18.9765 28.7443 18.9254 28.732 18.8814 28.7105C15.8277 27.0891 12.9479 25.1927 10.2822 23.0481C4.44141 18.3289 1.65383 13.7936 1.65365 9.58162C1.65657 7.31149 2.61264 5.12647 4.32641 3.50839C6.04154 1.88902 8.37498 0.97161 10.8167 0.968831C14.0701 0.968938 16.8474 2.35111 18.4662 4.60952Z"
          stroke="white"
          strokeWidth="1.38737"
        />
      </svg>
    </button>
  );
};

export default HeartCardButton;
