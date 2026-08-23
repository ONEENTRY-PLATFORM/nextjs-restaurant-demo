import { unstable_cache } from 'next/cache';
import type { IAdminEntity, IError, IFilterParams } from 'oneentry/types';
import { cache } from 'react';

import { getApi, getLang, isError } from '@/app/api';

interface HandleProps {
  body: IFilterParams[];
  offset: number;
  limit: number;
  langCode?: string;
}

type AdminsResult = {
  isError: boolean;
  error?: IError;
  admins?: IAdminEntity[];
};

const fetchAdminsInfo = unstable_cache(
  async (
    _signature: string,
    body: IFilterParams[],
    offset: number,
    limit: number,
    lang: string
  ): Promise<AdminsResult> => {
    try {
      const data = await getApi().Admins.getAdminsInfo(body, lang, offset, limit);
      if (isError(data)) {
        return { isError: true, error: data as IError };
      }
      // `{}` instead of a list — the SDK's empty/unparsable-body fallback; treat it as "no data".
      if (!Array.isArray(data)) {
        return { isError: false, admins: [] };
      }
      return { isError: false, admins: data };
    } catch (e: unknown) {
      return { isError: true, error: e as IError };
    }
  },
  ['oneentry-getAdminsInfo'],
  { revalidate: 300, tags: ['oneentry', 'oneentry-admins'] }
);

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
  async ({ body, offset, limit, langCode }: HandleProps): Promise<AdminsResult> => {
    const lang = langCode || getLang();
    // Filter objects are serialized into a stable signature so property order cannot fork the key.
    const signature = JSON.stringify([offset, limit, lang, body]);
    return fetchAdminsInfo(signature, body, offset, limit, lang);
  }
);
