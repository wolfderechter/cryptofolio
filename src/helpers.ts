export function humanReadableNumber(value: number): string {
  if (value >= 100) {
    return value.toFixed(0);
  } else if (value >= 1) {
    return value.toFixed(2);
  } else {
    return value.toFixed(4);
  }
}

export const SLEEP_TIME = 5_000;
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Extend this mapping as needed, based on the provided delta csv export while consulting the id/symbol from coingecko
const currencyMapping = {
  "AVAIL (Avail)": { id: "avail", symbol: "AVAIL" },
  "ADA (Cardano)": { id: "cardano", symbol: "ADA" },
  "AIXBT (aixbt by Virtuals)": { id: "aixbt", symbol: "AIXBT" },
  "ARB** (Arbitrum)": { id: "arbitrum", symbol: "ARB" },
  "AVAX (Avalanche)": { id: "avalanche-2", symbol: "AVAX" },
  "BCH (Bitcoin Cash)": { id: "bitcoin-cash", symbol: "BCH" },
  "BNB (BNB)": { id: "binancecoin", symbol: "BNB" },
  "BTC (Bitcoin)": { id: "bitcoin", symbol: "BTC" },
  "DOGE (Dogecoin)": { id: "dogecoin", symbol: "DOGE" },
  "DOT* (Polkadot)": { id: "polkadot", symbol: "DOT" },
  "ERG (Ergo)": { id: "ergo", symbol: "ERG" },
  "EIGEN (EigenLayer)": { id: "eigenlayer", symbol: "EIGEN" },
  "ETH (Ethereum)": { id: "ethereum", symbol: "ETH" },
  "FLT* (Fluence)": { id: "fluence-2", symbol: "FLT" },
  "GNO (Gnosis)": { id: "gnosis", symbol: "GNO" },
  "GRASS (Grass)": { id: "grass", symbol: "GRASS" },
  "HYPE****** (Hyperliquid)": { id: "hyperliquid", symbol: "HYPE" },
  "LINK (Chainlink)": { id: "chainlink", symbol: "LINK" },
  "LRC (Loopring)": { id: "loopring", symbol: "LRC" },
  "LTC (Litecoin)": { id: "litecoin", symbol: "LTC" },
  "MATIC (Polygon)": { id: "matic-network", symbol: "MATIC" },
  "OP* (Optimism)": { id: "optimism", symbol: "OP" },
  "PEPE (Pepe)": { id: "pepe", symbol: "PEPE" },
  "QNT (Quant)": { id: "quant-network", symbol: "QNT" },
  "RENDER* (Render)": { id: "render-token", symbol: "RENDER" },
  "STRK* (Starknet)": { id: "starknet", symbol: "STRK" },
  "SHIB (Shiba Inu)": { id: "shiba-inu", symbol: "SHIB" },
  "SOL* (Solana)": { id: "solana", symbol: "SOL" },
  "SWELL* (Swell)": { id: "swell-network", symbol: "SWELL" },
  "TAIKO (Taiko)": { id: "taiko", symbol: "TAIKO" },
  "TON (Toncoin)": { id: "the-open-network", symbol: "TON" },
  "TRX (TRON)": { id: "tron", symbol: "TRX" },
  "UNI (Uniswap)": { id: "uniswap", symbol: "UNI" },
  "USDC (USD Coin)": { id: "usd-coin", symbol: "USDC" },
  "USDT (Tether)": { id: "tether", symbol: "USDT" },
  "WETH (Wrapped Ether)": { id: "weth", symbol: "WETH" },
  "XMR (Monero)": { id: "monero", symbol: "XMR" },
  "XRP (XRP)": { id: "ripple", symbol: "XRP" },
};

export function mapCurrency(baseCurrencyName) {
  if (!currencyMapping[baseCurrencyName])
    console.log("basecurrencymapping not found", baseCurrencyName);

  return (
    currencyMapping[baseCurrencyName] || {
      id: baseCurrencyName
        .match(/\(([^)]+)\)/)[1]
        .toLowerCase()
        .replace(/\s+/g, "-"), // fallback: extract the name in parentheses and convert to lowercase with hyphens
      symbol: baseCurrencyName.split(" ")[0].replace(/\*+/g, ""), // fallback: extract first part and remove asterisks
    }
  );
}
