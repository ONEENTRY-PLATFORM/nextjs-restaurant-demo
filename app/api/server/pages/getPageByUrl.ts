import type { IError } from 'oneentry/dist/base/utils';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';

import { api } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * Получает объект страницы с информацией о формах, блоках, меню, привязанных к странице, по URL.
 */
export const getPageByUrl = async (
  url: string,
): Promise<{
  isError: boolean;
  error?: IError;
  page?: IPagesEntity;
}> => {
  try {
    const data = await api.Pages.getPageByUrl(url);

    if (typeError(data)) {
      return { isError: true, error: data };
    } else {
      return { isError: false, page: data };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return { isError: true, error: e };
  }
};
