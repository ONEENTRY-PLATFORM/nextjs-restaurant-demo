import type { IError } from 'oneentry/dist/base/utils';
import type { IPositionBlock } from 'oneentry/dist/pages/pagesInterfaces';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

interface HandleProps {
  pageUrl: string;
}

/**
 * Получает все блоки по url страницы.
 */
export const getBlocksByPageUrl = async ({
  pageUrl,
}: HandleProps): Promise<{
  isError: boolean;
  error?: IError;
  blocks?: IPositionBlock[];
}> => {
  try {
    const data = await getApi().Pages.getBlocksByPageUrl(pageUrl);

    if (typeError(data)) {
      return { isError: true, error: data };
    } else {
      return { isError: false, blocks: data };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return { isError: true, error: e };
  }
};
