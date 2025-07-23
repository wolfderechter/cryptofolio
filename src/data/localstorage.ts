import { getColor } from '../charts/colors';
import { CryptoCurrency } from "../cryptocurrency";
import { cryptocurrencies, init } from "../main";
import { Transaction, transactionType } from "../transaction";

/**
 * Save cryptocurrencies to localstorage.
 */
export function saveData() {
  localStorage.setItem("assets", JSON.stringify(cryptocurrencies));
}

/**
 * load in data from an optional input string or else from localstorage.
 * Will clear out the current cryptocurrencies object and fill up with the new data.
 * @param input: optional string of cryptocurrency objects in jsom format
 */
export async function loadData(input?: string) {
  // Check if there is an input string with the data, else check the localstorage for the data. Parse that data and create the cryptocurrency objects
  let cryptos: CryptoCurrency[];
  try {
    cryptos = JSON.parse(input ?? localStorage.getItem("assets") ?? "null");
  } catch (error) {
    console.error("Failed to parse data: ", error);
    return;
  }

  if (cryptos == null || !Array.isArray(cryptos)) return;

  cryptocurrencies.length = 0; // clear the array

  // Recreate the objects from JSON
  try {
    cryptos.forEach((crypto: any) => {
      const newCrypto = new CryptoCurrency(
        crypto.id,
        crypto.symbol,
        crypto.name,
        crypto.color,
      );

      crypto.transactions.forEach((transaction: any) => {
        newCrypto.addTransaction(
          new Transaction(
            transaction.type.toUpperCase() === "BUY" ? transactionType.Buy : transactionType.Sell,
            new Date(transaction.date),
            transaction.amount,
            transaction.cost,
            transaction.uuid,
          ),
        );
      });

      cryptocurrencies.push(newCrypto);
    });
  } catch (error) {
    console.error("Failed to recreate objects from JSON: ", error);
    return;
  }

  // SaveData to localstorage if input was used
  if (input) {
    saveData();
    init();
  }
}

/**
 * Set up the exportDataBtn to download the cryptocurrencies as a JSON file on click.
 */
const exportDataBtn = document.getElementById("exportDataBtn")!;
if (exportDataBtn) {
  exportDataBtn.addEventListener("click", () => {
    const data = JSON.stringify(cryptocurrencies, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    exportDataBtn.setAttribute("href", url);
    exportDataBtn.setAttribute("download", "cryptofolioData.json");
  });
}

const exportDataCsvBtn = document.getElementById("exportDataCsvBtn")!;
if (exportDataCsvBtn) {
  exportDataCsvBtn.addEventListener("click", () => {
    const csv = convertToCsv(cryptocurrencies);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    exportDataCsvBtn.setAttribute("href", url);
    exportDataCsvBtn.setAttribute("download", "cryptofolioData.csv");
  });
}

function convertToCsv(data: CryptoCurrency[]): string {
  const header = ["Date", "Way", "Base amount", "Quote amount", "Quote currency", "Coingecko id", "Symbol"];
  let csvContent = header.join(",") + "\n";

  for (let crypto of data) {
    for (let transaction of crypto.transactions) {
      const result = [
        transaction.date.toISOString(),
        transaction.type,
        transaction.amount,
        transaction.cost,
        "USD", // Using USD as the quote currency by default for now
        crypto.name,
        crypto.symbol,
      ];
      csvContent += result.join(",") + "\n";
    }
  }
  return csvContent;
}

/**
 * Will import data from a file and call the loadData function with this data.
 */
export function importJsonData(event: { preventDefault: () => void }) {
  // Stop the form from reloading the page
  event.preventDefault();

  const input = document.getElementById("importDataJsonBtn") as HTMLInputElement;

  // If there's no file, do nothing
  if (!input?.files?.length) return;

  // Create a new FileReader() object to read in files
  const reader = new FileReader();
  reader.readAsText(input.files[0]);

  reader.onload = (e) => {
    let str = e?.target?.result as string;
    loadData(str);
  };
}

export function importCsvData(event: { preventDefault: () => void }) {
  // Stop the form from reloading the page
  event.preventDefault();

  const input = document.getElementById("importDataCsvBtn") as HTMLInputElement;

  // If there's no file, do nothing
  if (!input?.files?.length) return;

  // Create a new FileReader() object to read in files
  const reader = new FileReader();
  reader.readAsText(input.files[0]);

  reader.onload = (e) => {
    const csvData = e?.target?.result as string;
    const parsedData = parseCsv(csvData);
    loadDataFromCsv(parsedData);
  };
}

function parseCsv(csvData: string): any[] {
  const rows = csvData.split("\n").filter((row) => row.trim() !== ""); // split into rows and remove empty lines
  const header = rows[0].split(",").map((field) => field.trim().replace(/^"(.*)"$/, "$1")); // Remove quotes from headers too
  const data: any[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].split(",");
    const rowData: any = {};

    for (let j = 0; j < header.length; j++) {
      rowData[header[j]] = row[j].trim().replace(/^"(.*)"$/, "$1"); // Remove surrounding quotes
    }

    data.push(rowData);
  }
  return data;
}

// Based on the delta csv export format
function loadDataFromCsv(parsedData: any[]) {
  const cryptoMap: { [key: string]: CryptoCurrency } = {};

  for (const row of parsedData) {
    const { Date, Way } = row;
    const transactionTypeValue = Way.toUpperCase() === "BUY" ? transactionType.Buy : transactionType.Sell;
    let id, symbol;

    // If csv is coming from delta, map the base currency name to coingecko standard first
    if(row["Base currency (name)"] !== undefined) {
      const mapping = mapCurrency(row["Base currency (name)"]);
      id = mapping.id;
      symbol = mapping.symbol;
    } else if (row["Coingecko id"] !== null && row["symbol"] !== null) {
      id = row["Coingecko id"];
      symbol = row["Symbol"];
    } else {
      console.error("Could not map currency for row, please make the csv conform with the example", row);
    }

    // Check if cryptocurrency exists, create if not
    if (!cryptoMap[id]) {
      cryptoMap
      const existingColors = new Set(Object.values(cryptoMap).map((c) => c.color));
      cryptoMap[id] = new CryptoCurrency(id, symbol, id, getColor(existingColors));
    }

    const transaction = new Transaction(
      transactionTypeValue,
      Date,
      parseFloat(row["Base amount"]), // amount of tokens
      parseFloat(row["Quote amount"]), // cost in eur/usd
    );

    cryptoMap[id].addTransaction(transaction);
  }

  // Clear existing data and load in new
  cryptocurrencies.length = 0;
  Object.values(cryptoMap).forEach((crypto) => cryptocurrencies.push(crypto));

  saveData();
  init();
}

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
  "XRP (XRP)": { id: "ripple", symbol: "XRP" }
};

function mapCurrency(baseCurrencyName) {
  if(!currencyMapping[baseCurrencyName])
    console.log("basecurrencymapping not found", baseCurrencyName);

  return currencyMapping[baseCurrencyName] || {
    id: baseCurrencyName.match(/\(([^)]+)\)/)[1].toLowerCase().replace(/\s+/g, '-'), // fallback: extract the name in parentheses and convert to lowercase with hyphens
    symbol: baseCurrencyName.split(' ')[0].replace(/\*+/g, '') // fallback: extract first part and remove asterisks
  };
}
