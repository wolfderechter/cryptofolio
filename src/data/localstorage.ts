import { getColor } from "../charts/colors";
import { Cryptocurrency } from "../cryptocurrency";
import { mapCurrency } from "../helpers";
import { init } from "../main";
import { Transaction, transactionType } from "../transaction";
import * as store from "./store";

/**
 * Save cryptocurrencies to localstorage.
 */
export function saveData() {
  localStorage.setItem("assets", JSON.stringify(store.getAssets()));
}

/**
 * load in data from an optional input string or else from localstorage.
 * Will clear out the current cryptocurrencies object and fill up with the new data.
 * @param input: optional string of cryptocurrency objects in jsom format
 */
export async function loadDataFromJson(input?: string) {
  // Check if there is an input string with the data, else check the localstorage for the data. Parse that data and create the cryptocurrency objects
  let cryptos: Cryptocurrency[];
  try {
    cryptos = JSON.parse(input ?? localStorage.getItem("assets") ?? "null");
  } catch (error) {
    console.error("Failed to parse data: ", error);
    return;
  }

  if (cryptos == null || !Array.isArray(cryptos)) return;

  store.clearAssets();

  // Recreate the objects from JSON
  try {
    cryptos.forEach((crypto: any) => {
      const newCrypto = new Cryptocurrency(
        crypto.id,
        crypto.symbol,
        crypto.name,
        crypto.color
      );

      crypto.transactions.forEach((transaction: any) => {
        newCrypto.addTransaction(
          new Transaction(
            transaction.type.toUpperCase() === "BUY"
              ? transactionType.Buy
              : transactionType.Sell,
            new Date(transaction.date),
            transaction.amount,
            transaction.cost,
            transaction.uuid
          )
        );
      });

      store.addAsset(newCrypto);
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

export function convertToCsv(data: Cryptocurrency[]): string {
  const header = [
    "Date",
    "Way",
    "Base amount",
    "Quote amount",
    "Quote currency",
    "Coingecko id",
    "Symbol",
  ];
  let csvContent = `${header.join(",")}\n`;

  for (const crypto of data) {
    for (const transaction of crypto.transactions) {
      const result = [
        transaction.date.toISOString(),
        transaction.type,
        transaction.amount,
        transaction.cost,
        "USD", // Using USD as the quote currency by default for now
        crypto.name,
        crypto.symbol,
      ];
      csvContent += `${result.join(",")}\n`;
    }
  }
  return csvContent;
}

export function parseCsv(csvData: string): any[] {
  const rows = csvData.split("\n").filter((row) => row.trim() !== ""); // split into rows and remove empty lines
  const header = rows[0]
    .split(",")
    .map((field) => field.trim().replace(/^"(.*)"$/, "$1")); // Remove quotes from headers too
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
export function loadDataFromCsv(parsedData: any[]) {
  const cryptoMap: { [key: string]: Cryptocurrency } = {};

  for (const row of parsedData) {
    const baseType = row["Base type"];
    if (baseType && baseType.toUpperCase() !== "CRYPTO") continue; // only import cryptocurrencies, if column is present (delta export should have this)

    const way = row.Way;
    const transactionDate = new Date(row.Date);
    const transactionTypeValue =
      way.toUpperCase() === "BUY" ? transactionType.Buy : transactionType.Sell;
    let id: string, symbol: string;

    // If csv is coming from delta, map the base currency name to coingecko standard first
    if (row["Base currency (name)"] !== undefined) {
      const mapping = mapCurrency(row["Base currency (name)"]);
      id = mapping.id;
      symbol = mapping.symbol;
    } else if (row["Coingecko id"] !== null && row.Symbol !== null) {
      id = row["Coingecko id"];
      symbol = row.Symbol;
    } else {
      console.error(
        "Could not map currency for row, please make the csv conform with the example",
        row
      );
      continue;
    }

    // Check if cryptocurrency exists, create if not
    if (!cryptoMap[id]) {
      const existingColors = new Set(
        Object.values(cryptoMap).map((c) => c.color)
      );
      cryptoMap[id] = new Cryptocurrency(
        id,
        symbol,
        id,
        getColor(existingColors)
      );
    }

    const transaction = new Transaction(
      transactionTypeValue,
      transactionDate,
      parseFloat(row["Base amount"]), // amount of tokens
      parseFloat(row["Quote amount"]) // cost in eur/usd
    );

    cryptoMap[id].addTransaction(transaction);
  }

  // Clear existing data and load in new
  store.clearAssets();
  Object.values(cryptoMap).forEach((crypto) => {
    store.addAsset(crypto);
  });

  saveData();
  init();
}
