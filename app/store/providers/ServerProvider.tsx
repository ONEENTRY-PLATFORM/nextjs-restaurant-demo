import 'server-only';

import { cache } from 'react';

const serverContext = cache(() => new Map());

/**
 * ServerProvider — simple getter/setter for server components via React `cache`.
 *
 * @param   {string}                              key          - Storage key.
 * @param   {T | undefined}                       defaultValue - Optional initial value to seed under `key`.
 * @returns {[T | undefined, (value: T) => Map<string, unknown>]}                      Tuple `[value, setter]` — current value at `key` and a setter that writes a new one.
 */
export const ServerProvider = <T,>(key: string, defaultValue?: T) => {
  const global = serverContext();

  if (defaultValue !== undefined) {
    global.set(key, defaultValue);
  }

  return [global.get(key), (value: T) => global.set(key, value)];
};
