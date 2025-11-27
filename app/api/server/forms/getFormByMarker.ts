import type { IError } from 'oneentry/dist/base/utils';

import { api } from '@/app/api';
import { typeError } from '@/components/utils';

/**
 * Get form by marker.
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
    const data = await api.Forms.getFormByMarker(marker);

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
