import { getColor } from "../charts/colors";
import { Cryptocurrency } from "../cryptocurrency";
import { mapCurrency } from '../helpers';
import { init } from "../main";
import { Transaction, transactionType } from "../transaction";
import * as store from './store';

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
export async function loadData(input?: string) {
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

/**
 * Set up the exportDataBtn to download the cryptocurrencies as a JSON file on click.
 */
const exportDataBtn = document.getElementById("exportDataBtn");
if (exportDataBtn) {
  exportDataBtn.addEventListener("click", () => {
    const data = JSON.stringify(store.getAssets, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    exportDataBtn.setAttribute("href", url);
    exportDataBtn.setAttribute("download", "cryptofolioData.json");
  });
}

const exportDataCsvBtn = document.getElementById("exportDataCsvBtn");
if (exportDataCsvBtn) {
  exportDataCsvBtn.addEventListener("click", () => {
    const csv = convertToCsv(store.getAssets());
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    exportDataCsvBtn.setAttribute("href", url);
    exportDataCsvBtn.setAttribute("download", "cryptofolioData.csv");
  });
}

function convertToCsv(data: Cryptocurrency[]): string {
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

/**
 * Will import data from a file and call the loadData function with this data.
 */
export function importJsonData(event: { preventDefault: () => void }) {
  // Stop the form from reloading the page
  event.preventDefault();

  const input = document.getElementById(
    "importDataJsonBtn"
  ) as HTMLInputElement;

  // If there's no file, do nothing
  if (!input?.files?.length) return;

  // Create a new FileReader() object to read in files
  const reader = new FileReader();
  reader.readAsText(input.files[0]);

  reader.onload = (e) => {
    const str = e?.target?.result as string;
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
function loadDataFromCsv(parsedData: any[]) {
  const cryptoMap: { [key: string]: Cryptocurrency } = {};

  for (const row of parsedData) {
    const Way = row.Way;
    const transactionDate = new Date(row.Date);
    const transactionTypeValue =
      Way.toUpperCase() === "BUY" ? transactionType.Buy : transactionType.Sell;
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
      return;
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
  Object.values(cryptoMap).forEach((crypto) => store.addAsset(crypto));

  saveData();
  init();
}
