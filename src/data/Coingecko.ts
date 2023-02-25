const COINGECKO_API = "https://api.coingecko.com/api/v3/";

export async function getCoins(input: string): Promise<string[][]> {
  try {
    const query = `search?query=${input}`;
    const res = await fetch(COINGECKO_API + query);
    const jsonResult = await res.json();

    return jsonResult["coins"];
  } catch (error) {
    return [];
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
    query += "&vs_currencies=usd%2Ceth";

    const res = await fetch(COINGECKO_API + query);
    const jsonResult = await res.json();

    return jsonResult;
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
export async function getCoinChart(coin: string, days: number): Promise<string[]> {
  try {
    let query = COINGECKO_API + `coins/${coin}/market_chart?vs_currency=usd&days=${days - 1}&interval=daily`;
    const res = await fetch(query);
    const jsonResult = await res.json();

    // api supports 'prices' 'market_caps' and 'total_volumes' but we only need prices currently
    return jsonResult["prices"];
  } catch (error) {
    return [];
  }
}

/**
 * Get coin data on a certain date
 * @param coin: the unique crypto identifier string
 * @param date: The date of data snapshot in dd-mm-yyyy eg. 30-12-2022
 */
export async function getCoinOnDate(coin: string, day: string): Promise<string> {
  try {
    let query = COINGECKO_API + `coins/${coin}/history?date=${day}&localization=false`;
    const res = await fetch(query);
    const jsonResult = await res.json();

    return jsonResult["market_data"]["current_price"];
  } catch (error) {
    return "";
  }
}
