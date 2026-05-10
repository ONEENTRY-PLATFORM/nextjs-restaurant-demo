import type { IAdminEntity } from 'oneentry/dist/admins/adminsInterfaces';
import type { IError } from 'oneentry/dist/base/utils';
import type { IFilterParams } from 'oneentry/dist/products/productsInterfaces';
import { cache } from 'react';

import { getApi, getLang } from '@/app/api';
import { typeError } from '@/components/utils';

interface HandleProps {
  body: IFilterParams[];
  offset: number;
  limit: number;
  langCode?: string;
}

/**
 * getAdminsInfo — paginated list of admins with filter.
 *
 * @param   {HandleProps}     props          - Fetch arguments.
 * @param   {IFilterParams[]} props.body     - Filter parameters accepted by `Admins.getAdminsInfo`.
 * @param   {number}          props.offset   - Page offset.
 * @param   {number}          props.limit    - Page size.
 * @param   {string}          [props.langCode] - Optional explicit locale (defaults to `getLang()`).
 * @returns Promise resolving to `{ isError, error?, admins? }` (graceful fallback on SDK error).
 */
export const getAdminsInfo = cache(
  async ({
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
      const data = await getApi().Admins.getAdminsInfo(body, langCode || getLang(), offset, limit);
      if (typeError(data)) {
        return { isError: true, error: data as IError };
      } else {
        return { isError: false, admins: data };
      }
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  }
);
