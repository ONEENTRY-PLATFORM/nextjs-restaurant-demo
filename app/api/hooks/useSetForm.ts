'use client';

import type { IBodyPostFormData } from 'oneentry/types';
import { useState } from 'react';

import { getApi } from '@/app/api/api/api';

/**
 * useSetForm — submit form data via the FormData API.
 *
 * @returns Object `{ loading, sendData }` — `sendData(payload)` resolves to the post response or the thrown error.
 */
export const useSetForm = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const sendData = async (data: IBodyPostFormData) => {
    setLoading(true);
    try {
      return await getApi().FormData.postFormsData(data);
    } catch (e: unknown) {
      return e;
    } finally {
      setLoading(false);
    }
  };
  return {
    loading,
    sendData,
  };
};
