import type { IError } from 'oneentry/dist/base/utils';

import { getApi } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * Получает форму по маркеру.
 */
export const getFormByMarker = async (
  marker: string,
): Promise<{
  isError: boolean;
  error?: IError;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form?: any;
}> => {
  try {
    const data = await getApi().Forms.getFormByMarker(marker);

    if (typeError(data)) {
      return { isError: true, error: data };
    } else {
      return { isError: false, form: data };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return { isError: true, error: e };
  }
};
