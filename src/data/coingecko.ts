import { getCache, setCache, isCacheValid } from "./cache";

const COINGECKO_API = "https://api.coingecko.com/api/v3/";

/**
 * Search for cryptocurrencies by a searchterm
 * @param input: the searchterm for finding cryptocurrencies
 */
export async function getCoins(input: string): Promise<string[][]> {
  const cacheKey = `getCoins_${input}`;

  if (isCacheValid(cacheKey)) {
    return getCache(cacheKey).data;
  }

  try {
    const query = `search?query=${input}`;
    const res = await fetch(COINGECKO_API + query);
    const jsonResult = await res.json();

    const result = jsonResult["coins"];
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    return [];
  }
}

/**
 * Get prices of multiple coins at once
 * @param coins[]: array of unique crypto identifier strings
 */
export async function getCoinsPrices(coins: string[]): Promise<string[]> {
  const cacheKey = `getCoinsPrices_${coins.join(",")}`;

  if (isCacheValid(cacheKey)) {
    return getCache(cacheKey).data;
  }

  try {
    let query = `simple/price?ids=`;
    for (let i = 0; i < coins.length; i++) {
      query += coins[i];

      // Add '&2c after every coin, unless it's the last one
      if (i != coins.length - 1) {
        query += "%2C";
      }
    }

    // Add the currency in which it should be returned (usd)
    query += "&vs_currencies=usd";

    const response = await fetch(COINGECKO_API + query);
    const result = await response.json();

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    return [];
  }
}

/*
    Get historical market data include price, market cap, and 24h volume (granularity auto)

    Data granularity is automatic (cannot be adjusted)
    1 day from current time = 5 minute interval data
    1 - 90 days from current time = hourly data
    above 90 days from current time = daily data (00:00 UTC)

    example: 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=10'


 */
/**
 * Get historical market data chart based on parameters
 * @param coin: the unique crypto identifier string
 * @param days: How many days back to fetch data
 * @param interval: granularity of the data (hourly, daily...)
 */
export async function getCoinChart(
  coin: string,
  days: number,
  interval: string
): Promise<[string, number][]> {
  try {
    const cacheKey = `getCoinChart_${coin}_${days}_${interval}`;

    if (isCacheValid(cacheKey)) {
      return getCache(cacheKey).data;
    }

    let query =
      COINGECKO_API +
      `coins/${coin}/market_chart?vs_currency=usd&days=${days}&interval=${interval}`;
    const res = await fetch(query);
    const jsonResult = await res.json();

    // api supports 'prices' 'market_caps' and 'total_volumes' but we only need prices currently
    const result = jsonResult["prices"];
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    return [];
  }
}
