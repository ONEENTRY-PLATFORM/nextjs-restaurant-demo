import 'server-only';

const cache = new Map();

/**
 * Получает закэшированные данные.
 */
const getCachedData = async (
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchFn: () => Promise<any>,
) => {
  if (cache.has(key)) {
    return cache.get(key);
  }
  const data = await fetchFn();
  cache.set(key, data);
  return data;
};

export default getCachedData;
