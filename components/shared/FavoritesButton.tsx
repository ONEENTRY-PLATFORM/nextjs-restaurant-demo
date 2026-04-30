'use client';

import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { IUserEntity } from 'oneentry/dist/users/usersInterfaces';
import type { JSX } from 'react';
import { useContext } from 'react';
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
import HeartIcon from '@/components/icons/heart';
import HeartOpenIcon from '@/components/icons/heart-o';

/**
 * Кнопка избранного
 */
const FavoritesButton = (product: IProductsEntity): JSX.Element => {
  const dispatch = useAppDispatch();
  const { user, isAuth } = useContext(AuthContext);
  const { id } = product;
  const isFav = useAppSelector((state) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectIsFavorites(state as any, id),
  );

  /**
   * Обновить избранное
   */
  const onUpdateFavoritesHandle = () => {
    if (isFav) {
      dispatch(removeFavorites(product.id));
      toast(
        'Product ' + product.localizeInfos.title + ' removed from Favorites!',
      );
    } else {
      dispatch(addFavorites(product.id));
      toast('Product ' + product.localizeInfos.title + ' added to Favorites!');
    }
  };

  /**
   * Обновить данные избранного у пользователя
   * @async
   */
  const onUpdateUserFavoritesHandle = async () => {
    try {
      if (!isFav) {
        dispatch(addFavorites(product.id));
        await onSubscribeEvents(product.id);

        toast('Product ' + product.localizeInfos.title + ' add to Favorites!');
      } else {
        dispatch(removeFavorites(product.id));
        await onUnsubscribeEvents(product.id);

        toast(
          'Product ' + product.localizeInfos.title + ' removed from Favorites!',
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast('Auth error! ' + e?.message);
    }
  };

  if (!product) {
    return <></>;
  }

  return (
    <button
      type="button"
      className="group relative box-border flex size-6.5 shrink-0 flex-col items-center justify-center"
      onClick={() => {
        if (user && isAuth && (user as IUserEntity).id) {
          onUpdateUserFavoritesHandle();
        } else {
          onUpdateFavoritesHandle();
        }
      }}
      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isFav ? <HeartIcon /> : <HeartOpenIcon />}
    </button>
  );
};

export default FavoritesButton;
