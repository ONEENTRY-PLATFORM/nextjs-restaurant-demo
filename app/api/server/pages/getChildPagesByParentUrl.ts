import type { IError } from 'oneentry/dist/base/utils';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import { cache } from 'react';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * Получает объекты дочерних страниц с информацией в виде массива.
 * Обёрнут в React cache() — дедуплицирует одинаковые вызовы внутри одного рендера.
 */
export const getChildPagesByParentUrl = cache(
  async (
    url: string
  ): Promise<{
    isError: boolean;
    error?: IError;
    pages?: IPagesEntity[];
  }> => {
    try {
      const data = await getApi().Pages.getChildPagesByParentUrl(url);

      if (typeError(data)) {
        return { isError: true, error: data };
      } else {
        return { isError: false, pages: data as IPagesEntity[] };
      }
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  }
);
