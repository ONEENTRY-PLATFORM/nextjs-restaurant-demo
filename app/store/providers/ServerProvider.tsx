import 'server-only';

import { cache } from 'react';

const serverContext = cache(() => new Map());

/**
 * ServerProvider — simple getter/setter for server components via React `cache`.
 *
 * @param   {string} key          - Key.
 * @param   {T}      defaultValue - Default value.
 * @returns                       Tuple `[value, setter]`.
 */
export const ServerProvider = <T,>(key: string, defaultValue?: T) => {
  const global = serverContext();

  if (defaultValue !== undefined) {
    global.set(key, defaultValue);
  }

  return [global.get(key), (value: T) => global.set(key, value)];
};
