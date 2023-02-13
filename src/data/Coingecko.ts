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
