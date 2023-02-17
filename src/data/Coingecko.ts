const COINGECKO_API = "https://api.coingecko.com/api/v3/";

export async function getCoins(input: string) {
  try {
    const query = `search?query=${input}`;
    const res = await fetch(COINGECKO_API + query);
    const jsonResult = await res.json();

    return jsonResult["coins"];
  } catch (error) {
    console.error(error);
  }
}

export async function getCoinsPrices(coins: string[]): Promise<string[]> {
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

    const res = await fetch(COINGECKO_API + query);
    const jsonResult = await res.json();

    return jsonResult;
  } catch (error) {
    console.error(error);
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
export async function getCoinChart(
  coin: string,
  days: number
): Promise<string[]> {
  try {
    let query =
      COINGECKO_API +
      `coins/${coin}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
    console.log(query);
    const res = await fetch(query);
    const jsonResult = await res.json();

    // api supports 'prices' 'market_caps' and 'total_volumes' but we only need prices currently
    return jsonResult["prices"];
  } catch (error) {
    console.error(error);
    return [];
  }
}
