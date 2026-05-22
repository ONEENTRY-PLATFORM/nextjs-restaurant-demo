import 'server-only';

const cache = new Map<string, unknown>();

/**
 * getCachedData — process-wide in-memory cache keyed by string.
 *
 * Mostly redundant now that every underlying fetcher is wrapped in
 * `unstable_cache`; kept as a cheap no-op-on-hit guard for callers that
 * normalize SDK responses on top of cached input (e.g. `getDictionary`).
 *
 * @param   {string}            key     - Cache key.
 * @param   {() => Promise<T>}  fetchFn - Async fetcher invoked once per missing key.
 * @returns Promise resolving to the cached or freshly fetched value.
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
