import type { IError } from 'oneentry/dist/base/utils';
import type { IMenusEntity } from 'oneentry/dist/menus/menusInterfaces';
import { cache } from 'react';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * Получает страницы, включённые в меню, по маркеру.
 * Обёрнут в React cache() — дедуплицирует одинаковые вызовы внутри одного рендера.
 */
export const getMenuByMarker = cache(
  async (
    marker: string
  ): Promise<{
    isError: boolean;
    error?: IError;
    menu?: IMenusEntity;
  }> => {
    try {
      const data = await getApi().Menus.getMenusByMarker(marker);

      if (typeError(data)) {
        return { isError: true, error: data };
      } else {
        return { isError: false, menu: data };
      }
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  }
);
