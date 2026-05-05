import type { IError } from 'oneentry/dist/base/utils';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import { cache } from 'react';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * Получает объект страницы с информацией о формах, блоках, меню, привязанных к странице, по URL.
 * Обёрнут в React cache() — дедуплицирует одинаковые вызовы внутри одного рендера.
 */
export const getPageByUrl = cache(
  async (
    url: string
  ): Promise<{
    isError: boolean;
    error?: IError;
    page?: IPagesEntity;
  }> => {
    try {
      const data = await getApi().Pages.getPageByUrl(url);

      if (typeError(data)) {
        return { isError: true, error: data };
      } else {
        return { isError: false, page: data };
      }
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  }
);
