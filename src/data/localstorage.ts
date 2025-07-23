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
  const header = ["id", "symbol", "date", "amount", "cost", "transactionType"];
  let csvContent = header.join(",") + "\n";

  for (let crypto of data) {
    for (let transaction of crypto.transactions) {
      const result = [
        crypto.name,
        crypto.symbol,
        transaction.date.toISOString(),
        transaction.amount,
        transaction.cost,
        transaction.type,
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
  const header = rows[0].split(",").map((field) => field.trim());
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

function loadDataFromCsv(parsedData: any[]) {
  const cryptoMap: { [key: string]: CryptoCurrency } = {};

  for (const row of parsedData) {
    const { id, symbol, date, amount, cost, transactionType: transactionTypeString } = row;

    const transactionTypeValue = transactionTypeString.toUpperCase() === "BUY" ? transactionType.Buy : transactionType.Sell;

    // Check if cryptocurrency exists, create if not
    if (!cryptoMap[id]) {
      cryptoMap[id] = new CryptoCurrency(id, symbol);
    }

    const transaction = new Transaction(
      transactionTypeValue,
      new Date(date),
      parseFloat(amount),
      parseFloat(cost),
    );

    cryptoMap[id].addTransaction(transaction);
  }

  // Clear existing data and load in new
  cryptocurrencies.length = 0;
  Object.values(cryptoMap).forEach((crypto) => cryptocurrencies.push(crypto));

  saveData();
  init();
}
