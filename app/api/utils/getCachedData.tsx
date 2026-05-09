import 'server-only';

const cache = new Map<string, unknown>();

/** getCachedData — мемоизированный кэш по ключу (in-memory Map). */
const getCachedData = async <T,>(key: string, fetchFn: () => Promise<T>): Promise<T> => {
  if (cache.has(key)) {
    return cache.get(key) as T;
  }
  const data = await fetchFn();
  cache.set(key, data);
  return data;
};

export default getCachedData;
