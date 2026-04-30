import 'server-only';

import { cache } from 'react';

const serverContext = cache(() => new Map());

/**
 * Простой server provider
 * @param         key          key
 * @param         defaultValue defaultValue
 * @componentType Server component
 * @returns                    Геттер/сеттер провайдера
 */
export const ServerProvider = <T,>(key: string, defaultValue?: T) => {
  const global = serverContext();

  if (defaultValue !== undefined) {
    global.set(key, defaultValue);
  }

  return [global.get(key), (value: T) => global.set(key, value)];
};
