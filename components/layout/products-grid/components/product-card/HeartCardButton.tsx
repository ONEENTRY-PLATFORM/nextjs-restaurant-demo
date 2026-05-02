'use client';

import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { IUserEntity } from 'oneentry/dist/users/usersInterfaces';
import { type JSX, useContext, useSyncExternalStore } from 'react';
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
 * HeartCardButton — переключает продукт в сторе избранного.
 * Использует тот же SVG `heart_card` из вёрстки, так что визуал карточки 1:1
 * с `static-html/index.html`. Заполненная обводка, когда в избранном.
 *
 * Лежит над абсолютным click-through оверлеем `<Link>` в ProductCard
 * через z-index, чтобы клик по сердцу не приводил к навигации.
 * @param   {object}          props         - Пропсы компонента.
 * @param   {IProductsEntity} props.product - Продукт для переключения.
 * @returns {JSX.Element}                   JSX кнопки-сердца.
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
  // Избранное восстанавливается из localStorage на клиенте после гидратации,
  // так что SSR видит `false`, в то время как клиент может увидеть `true` —
  // обойти через useSyncExternalStore, чтобы серверный снапшот был `false`,
  // а клиент после маунта переключился на `true`, соответствуя persisted slice.
  const hydrated = useSyncExternalStore(
    (cb) => {
      cb();
      return () => {};
    },
    () => true,
    () => false,
  );
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
