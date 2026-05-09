import 'server-only';

import { cache } from 'react';

const serverContext = cache(() => new Map());

/**
 * ServerProvider — простой геттер/сеттер для server-компонентов через React `cache`.
 *
 * @param   {string} key          - Ключ.
 * @param   {T}      defaultValue - Значение по умолчанию.
 * @returns                       Кортеж `[value, setter]`.
 */
export const ServerProvider = <T,>(key: string, defaultValue?: T) => {
  const global = serverContext();

  if (defaultValue !== undefined) {
    global.set(key, defaultValue);
  }

  return [global.get(key), (value: T) => global.set(key, value)];
};
