import { CryptoCurrency } from "../Cryptocurrency";
import { cryptocurrencies, init } from "../main";
import { Transaction } from "../Transaction";

export function saveData() {
  localStorage.setItem("assets", JSON.stringify(cryptocurrencies));
}

export async function loadData(input?: string) {
  // Check if there is an input string with the data, else check the localstorage for the data. Parse that data and create the cryptocurrency objects
  let cryptos;
  if (input) {
    cryptos = JSON.parse(input);
  } else {
    let cryptosString;
    if ((cryptosString = localStorage.getItem("assets"))) cryptos = JSON.parse(cryptosString);
  }
  if (cryptos == null) return;

  cryptocurrencies.forEach((c) => cryptocurrencies.pop());

  // Recreate the objects from JSON
  cryptos.forEach((crypto: any) => {
    let newCrypto = new CryptoCurrency(crypto.id, crypto.symbol, crypto.name);

    crypto.transactions.forEach((transaction: any) => {
      newCrypto.addTransaction(new Transaction(transaction.type, new Date(transaction.date), transaction.amount, transaction.cost));
    });

    cryptocurrencies.push(newCrypto);
  });
  // SaveData to localstorage if input was used
  if (input) {
    saveData();
    init();
  }
}

export function exportData() {
  let data = JSON.stringify(cryptocurrencies, null, 2);
  var exportDataBtn = document.getElementById("exportDataBtn")!;

  exportDataBtn.onclick = () => {
    exportDataBtn.setAttribute("href", URL.createObjectURL(new Blob([data], { type: "application/json" })));
    exportDataBtn.setAttribute("download", "cryptofolioData.json");
  };
}

export function importData(event: { preventDefault: () => void }) {
  let input = <HTMLInputElement>document.getElementById("importDataBtn");

  // Stop the form from reloading the page
  event.preventDefault();

  // If there's no file, do nothing
  if (!input.value.length) return;

  // Create a new FileReader() object
  let reader = new FileReader();

  // Read the file
  if (input.files) reader.readAsText(input.files[0]);

  reader.onload = (e) => {
    let str = <string>e?.target?.result;
    loadData(str);
  };
}
