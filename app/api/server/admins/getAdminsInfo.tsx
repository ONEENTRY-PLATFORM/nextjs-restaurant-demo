/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IAdminEntity } from 'oneentry/dist/admins/adminsInterfaces';
import type { IError } from 'oneentry/dist/base/utils';

import { api, getLang } from '@/app/api';
import { typeError } from '@/components/utils';

interface HandleProps {
  body: any[];
  offset: number;
  limit: number;
  langCode?: string;
}

/**
 * Получает один атрибут с данными из attribute sets.
 */
export const getAdminsInfo = async ({
  body,
  offset,
  limit,
  langCode,
}: HandleProps): Promise<{
  isError: boolean;
  error?: IError;
  admins?: IAdminEntity[];
}> => {
  try {
    const data = await api.Admins.getAdminsInfo(
      body,
      langCode || getLang(),
      offset,
      limit,
    );
    if (typeError(data)) {
      return { isError: true, error: data as IError };
    } else {
      return { isError: false, admins: data };
    }
  } catch (e: any) {
    return { isError: true, error: e };
  }
};
