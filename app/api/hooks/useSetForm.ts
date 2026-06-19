'use client';

import type { IBodyPostFormData } from 'oneentry/dist/forms-data/formsDataInterfaces';
import { useState } from 'react';

import { getApi } from '@/app/api';

/**
 * useSetForm — submit form data via the FormData API.
 *
 * `sendData` awaits the SDK call and toggles `loading` around the in-flight
 * request, so consumers get an accurate pending state and a resolved response.
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
