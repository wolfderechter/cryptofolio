const COINGECKO_API = "https://api.coingecko.com/api/v3/";

export async function getCoins(input: string) {
  try {
    const query = `search?query=${input}`;
    const res = await fetch(COINGECKO_API + query);
    const jsonResult = await res.json();

    return jsonResult["coins"];
  } catch (error) {
    console.log(error);
  }
}

export async function getCoinPrices(coins: string[]): Promise<string[]> {
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

    console.log(COINGECKO_API + query);
    const res = await fetch(COINGECKO_API + query);
    const jsonResult = await res.json();

    return jsonResult;
  } catch (error) {
    console.log(error);
    return [];
  }
}
