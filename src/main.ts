import { renderCharts } from "./charts/PieChart";
import { Coin, CryptoCurrency } from "./cryptocurrency";
import { getCoins } from "./data/Coingecko";
import { saveData, loadData } from "./data/localstorage";
import { Transaction } from "./Transaction";

export const cryptocurrencies: CryptoCurrency[] = [];
const addCryptoBtn = document.querySelector<HTMLButtonElement>("#addCrypto");
const searchModal = document.getElementById("seach-modal")!;
const transactionModal = document.getElementById("transaction-modal")!;
const searchModalCloseBtn = document.getElementById("search-modal-close");
const transactionModalCloseBtn = document.getElementById(
  "transaction-modal-close"
);
const searchForm = document.querySelector<HTMLFormElement>("#searchForm");
const transactionForm =
  document.querySelector<HTMLFormElement>("#transactionForm");
loadData();

// adding a crypto opens the modal with a search bar
addCryptoBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  if (searchModal) {
    searchModal.style.display = "block";

    // Clear the popup before opening it
    const cryptoListDiv = document.getElementById("cryptoList")!;
    cryptoListDiv.innerHTML = "";
  }
});

searchModalCloseBtn?.addEventListener("click", (e) => {
  closeSearchModal(e);
});

function closeSearchModal(e?: MouseEvent) {
  e?.preventDefault();
  if (searchModal && searchForm) {
    searchModal.style.display = "none";
    searchForm.reset();
  }
}

transactionModalCloseBtn?.addEventListener("click", (e) => {
  closeTransactionModal(e);
});

function closeTransactionModal(e?: MouseEvent) {
  e?.preventDefault();
  if (transactionModal && transactionForm) {
    transactionModal.style.display = "none";
    transactionForm.reset();
  }
}

document.getElementById("searchForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  searchCrypto();
});

function searchCrypto() {
  const input = document.querySelector<HTMLInputElement>(
    "#crypto-search-input"
  )!;
  // const innerModal = document.getElementById("inner-modal-content")!;
  const cryptoListDiv = document.getElementById("cryptoList")!;
  // Clear the list when entering a new search
  cryptoListDiv.innerHTML = "";

  // Do a search request to coingecko, passing the searchterm
  // take the coins section returned and display it
  getCoins(input.value).then((data) => {
    for (let c in data) {
      let coinDiv = document.createElement("div");
      let thumbnail = document.createElement("img");
      thumbnail.src = data[c].large;
      let name = document.createElement("p");
      name.textContent = data[c].name;
      coinDiv.appendChild(thumbnail);
      coinDiv.appendChild(name);

      // When selecting a certain coin, clear the popup and continue with the coin selected
      coinDiv.onclick = function (e) {
        e.preventDefault();
        closeSearchModal();
        startTransaction({
          id: data[c].id,
          symbol: data[c].symbol,
          name: data[c].name,
        });
      };
      cryptoListDiv.appendChild(coinDiv);
    }
  });
}

function startTransaction(coin: Coin) {
  // Switch the modal popup to the transaction popup
  transactionModal.style.display = "block";

  const addTransactionBtn = document.getElementById("addTransactionBtn")!;
  const transactionTitle = document.getElementById("transactionModalTitle")!;

  // Set the date input to today by default
  const transactionDate = <HTMLInputElement>(
    document.getElementById("transactionDate")
  );
  transactionDate.valueAsDate = new Date();

  transactionTitle.textContent = coin.name;

  addTransactionBtn.onclick = (e) => {
    e.preventDefault();
    // Create the cryptocurrency object
    // Add the transaction
    let resultCrypto = cryptocurrencies.find((c) => c.id === coin.id);

    // If crypto was already present, add new transaction
    if (resultCrypto) {
      resultCrypto.addTransaction(
        new Transaction(
          new Date(transactionDate.value),
          Number(
            (<HTMLInputElement>document.getElementById("transactionAmount"))
              .value
          ),
          Number(
            (<HTMLInputElement>document.getElementById("transactionCost")).value
          )
        )
      );
    } else {
      // If crypto was not yet present, create it and add new transaction
      let newCrypto = new CryptoCurrency(coin.id, coin.symbol, coin.name);
      cryptocurrencies.push(newCrypto);

      newCrypto.addTransaction(
        new Transaction(
          new Date(
            (<HTMLInputElement>document.getElementById("transactionDate")).value
          ),
          Number(
            (<HTMLInputElement>document.getElementById("transactionAmount"))
              .value
          ),
          Number(
            (<HTMLInputElement>document.getElementById("transactionCost")).value
          )
        )
      );
    }
    // Persist the data
    saveData();

    // Close the transaction modal when done
    closeTransactionModal();
    populateAssetsTable();
    renderCharts();
  };
}

function populateAssetsTable() {
  const tableBody = document.getElementById("assetsTableBody")!;
  tableBody.innerHTML = "";

  cryptocurrencies.forEach((asset) => {
    // startTransaction({ id: asset.id, symbol: asset.symbol, name: asset.name });
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${asset.symbol}</td>
      <td>${asset.averageBuyPrice}</td>
      <td>${asset.totalAmount}</td>
      <td>${asset.totalCost}</td>
      <td>
          <button id="assetsTableAdd" class="fa fa-plus"></button>
          <button id="assetsTableManage" class="fa fa-pencil-square-o"></button>
      </td>
    `;
    const addButton = tr.querySelector<HTMLButtonElement>("#assetsTableAdd");
    if (addButton) {
      addButton.onclick = () =>
        startTransaction({
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
        });
    }

    // _ = tr.click(startTransaction({
    //   id: asset.id,
    //   symbol: asset.symbol,
    //   name: asset.name,
    // });
    tableBody?.appendChild(tr);
  });
}
populateAssetsTable();
renderCharts();
