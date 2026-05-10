import 'server-only';

const cache = new Map<string, unknown>();

/**
 * getCachedData — memoized cache keyed by string (in-memory Map).
 *
 * @param   {string}          key     - Cache key.
 * @param   {() => Promise<T>} fetchFn - Async fetcher invoked once per missing key.
 * @returns {Promise<T>}                Promise resolving to the cached or freshly fetched value.
 */
const getCachedData = async <T,>(key: string, fetchFn: () => Promise<T>): Promise<T> => {
  if (cache.has(key)) {
    return cache.get(key) as T;
  }
  const data = await fetchFn();
  cache.set(key, data);
  return data;
};

export default getCachedData;
