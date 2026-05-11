'use client';

import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { IUserEntity } from 'oneentry/dist/users/usersInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect, useState } from 'react';
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
import HeartIcon from '@/components/icons/heart';
import HeartOpenIcon from '@/components/icons/heart-o';

/**
 * FavoritesButton — heart button on the product page; toggles favorites locally and on the server when authenticated.
 *
 * @param   {IProductsEntity} product - OneEntry product entity (component is called with the product as props).
 * @returns JSX of the heart toggle button.
 */
const FavoritesButton = (product: IProductsEntity): JSX.Element => {
  const t = useT();
  const dispatch = useAppDispatch();
  const { user, isAuth } = useContext(AuthContext);
  const { id } = product;
  const isFavStored = useAppSelector(state => selectIsFavorites(state, id));
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const isFav = mounted ? isFavStored : false;

  const titleSlot = (template: string) =>
    template.replace('{title}', product.localizeInfos.title);

  const onUpdateFavoritesHandle = () => {
    if (isFav) {
      dispatch(removeFavorites(product.id));
      toast(
        titleSlot(t('product_removed_favorites_toast', 'Product {title} removed from Favorites!'))
      );
    } else {
      dispatch(addFavorites(product.id));
      toast(
        titleSlot(t('product_added_favorites_toast', 'Product {title} added to Favorites!'))
      );
    }
  };

  const onUpdateUserFavoritesHandle = async () => {
    try {
      if (!isFav) {
        dispatch(addFavorites(product.id));
        await onSubscribeEvents(product.id);

        toast(
          titleSlot(t('product_added_favorites_toast', 'Product {title} added to Favorites!'))
        );
      } else {
        dispatch(removeFavorites(product.id));
        await onUnsubscribeEvents(product.id);

        toast(
          titleSlot(
            t('product_removed_favorites_toast', 'Product {title} removed from Favorites!')
          )
        );
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      toast(t('auth_error_prefix', 'Auth error!') + ' ' + message);
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
      aria-label={
        isFav
          ? t('remove_from_favorites_label', 'Remove from favorites')
          : t('add_to_favorites_label', 'Add to favorites')
      }
    >
      {isFav ? <HeartIcon /> : <HeartOpenIcon />}
    </button>
  );
};

export default FavoritesButton;
