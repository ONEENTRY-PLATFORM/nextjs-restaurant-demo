import type { IError } from 'oneentry/dist/base/utils';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * Получает объекты дочерних страниц с информацией в виде массива.
 */
export const getChildPagesByParentUrl = async (
  url: string,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return { isError: true, error: e };
  }
};
