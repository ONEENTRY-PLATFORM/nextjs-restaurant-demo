'use client';

import type { IBodyPostFormData } from 'oneentry/dist/forms-data/formsDataInterfaces';
import { useState } from 'react';

import { getApi } from '@/app/api';

/**
 * Отправка данных формы через FormData API.
 */
export const useSetForm = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const sendData = (data: IBodyPostFormData) => {
    setLoading(true);
    const result = async () => {
      try {
        const res = await getApi().FormData.postFormsData(data);
        return res;
      } catch (e: unknown) {
        return e;
      }
    };
    setLoading(false);
    return result;
  };
  return {
    loading,
    sendData,
  };
};
