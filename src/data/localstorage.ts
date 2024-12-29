import { CryptoCurrency } from "../cryptocurrency";
import { cryptocurrencies, init } from "../main";
import { Transaction } from "../transaction";

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
        crypto.thumbnail,
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

/**
 * Will import data from a file and call the loadData function with this data.
 */
export function importData(event: { preventDefault: () => void }) {
  // Stop the form from reloading the page
  event.preventDefault();

  const input = document.getElementById("importDataBtn") as HTMLInputElement;

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

function convertToCsv(data: CryptoCurrency[]): string {
  const header = ["id", "symbol", "date", "amount", "cost", "transactionType"];
  let csvContent = header.join(",") + "\n";

  for (let crypto of data) {
    for (let transaction of crypto.transactions) {
      const result = [
        crypto.id,
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
