export function getCache(key: string): any | null {
  const cachedData = localStorage.getItem(key);
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  return null;
}

// Default cache of 1 hour
export function setCache(
  key: string,
  data: any,
  ttl: number = 60 * 60 * 1000
): void {
  const cacheData = {
    data,
    expiry: Date.now() + ttl,
  };
  localStorage.setItem(key, JSON.stringify(cacheData));
}

export function isCacheValid(key: string): boolean {
  const cachedData = getCache(key);
  const isCacheValid = cachedData && cachedData.expiry > Date.now();

  // Remove stale cache items to keep localStorage clean
  if (!isCacheValid) localStorage.removeItem(key);

  return isCacheValid;
}
