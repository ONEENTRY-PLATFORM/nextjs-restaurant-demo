import type { IError } from 'oneentry/dist/base/utils';
import type { IMenusEntity } from 'oneentry/dist/menus/menusInterfaces';

import { api } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * Получает страницы, включённые в меню, по маркеру.
 */
export const getMenuByMarker = async (
  marker: string,
): Promise<{
  isError: boolean;
  error?: IError;
  menu?: IMenusEntity;
}> => {
  try {
    const data = await api.Menus.getMenusByMarker(marker);

    if (typeError(data)) {
      return { isError: true, error: data };
    } else {
      return { isError: false, menu: data };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return { isError: true, error: e };
  }
};
