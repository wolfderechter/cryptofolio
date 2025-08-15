import { getMillisecondsUntilMidnight } from "../helpers";
import { openCryptocurrencyModal } from "../ui/cryptocurrencyModal";
import { getCache, isCacheValid, setCache } from "./cache";

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

    const result = jsonResult.coins;
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error fetching coins:", error);
    return [];
  }
}

/**
 * Get prices of multiple coins at once
 * @param coins[]: array of unique crypto identifier strings
 */
export async function getCoinsPrices(coins: string[]): Promise<string[]> {
  const sortedCoins = coins.sort();
  const cacheKey = `getCoinsPrices_${sortedCoins.join(",")}`;

  if (isCacheValid(cacheKey)) {
    return getCache(cacheKey).data;
  }

  try {
    let query = `simple/price?ids=`;
    for (let i = 0; i < coins.length; i++) {
      query += coins[i];

      // Add '&2c after every coin, unless it's the last one
      if (i !== coins.length - 1) {
        query += "%2C";
      }
    }

    // Add the currency in which it should be returned (usd)
    query += "&vs_currencies=usd";

    const response = await fetch(COINGECKO_API + query);
    const result = await response.json();

    if (Object.entries(result).length !== coins.length) {
      console.log(
        "Error fetching coin prices: Mismatch in expected number of coins likely caused by a wrong coingecko id for one or more of the cryptocurrencies"
      );
      for (const coin of coins) {
        // open the first coin that is not mapped correctly, let user fix which will run init again
        if (!result[coin]) {
          openCryptocurrencyModal(coin);
          break;
        }
      }
      return [];
    }

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error fetching coin prices:", error);
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
export async function getCoinChart(coin: string): Promise<[string, number][]> {
  try {
    const cacheKey = `getCoinChart_${coin}_daily`;

    if (isCacheValid(cacheKey)) {
      return getCache(cacheKey).data;
    }

    const query =
      COINGECKO_API +
      `coins/${coin}/market_chart?vs_currency=usd&days=365&interval=daily`;
    const res = await fetch(query);
    const jsonResult = await res.json();
    if (!res.ok) {
      if (jsonResult.error === "coin not found") openCryptocurrencyModal(coin);
      throw new Error();
    }

    // api supports 'prices' 'market_caps' and 'total_volumes' but we only need prices currently
    const result = jsonResult.prices;
    setCache(cacheKey, result, getMillisecondsUntilMidnight()); // cache until midnight so the chart data is updated daily
    return result;
  } catch (error) {
    console.error("Error fetching coin chart data:", error);
    return [];
  }
}
