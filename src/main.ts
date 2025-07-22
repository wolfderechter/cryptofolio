import { Coin, CryptoCurrency } from "./cryptocurrency";
import {
  saveData,
  loadData,
  importData,
  importCsvData,
} from "./data/localstorage";
import { getCoins, getCoinsPrices } from "./data/coingecko";
import { Transaction, transactionType } from "./transaction";
import { renderCharts } from "./charts/init";
import { CountUp } from "countup.js";

export const cryptocurrencies: CryptoCurrency[] = [];
// Used for sleeping after API requests to prevent being rate limited. In ms.
export let SLEEP_TIME = 10_000;

const addCryptoBtn = document.querySelector<HTMLButtonElement>("#addCrypto");

// Modals
const searchModal = <HTMLDialogElement> document.getElementById("seach-modal")!;
const transactionModal = <HTMLDialogElement> document.getElementById("transaction-modal")!;
const manageTransactionsModal = <HTMLDialogElement> document.getElementById(
  "manage-transactions-modal"
)!;
const editTransactionModal = <HTMLDialogElement> document.getElementById("edit-transaction-modal")!;

// Close Btns
const searchModalCloseBtn = document.getElementById("search-modal-close");
const transactionModalCloseBtn = document.getElementById(
  "transaction-modal-close"
);
const manageTransactionsModalCloseBtn = document.getElementById(
  "manage-transactions-modal-close"
);
const editTransactionModalCloseBtn = document.getElementById(
  "edit-transaction-modal-close"
);

// Forms
const searchForm = document.querySelector<HTMLFormElement>("#searchForm");
const transactionForm =
  document.querySelector<HTMLFormElement>("#transactionForm");

// Summary
const summaryTotalValue = document.getElementById("summaryTotalValue")!;
const summaryTotalValueContent = document.getElementById(
  "summaryTotalValueContent"
)!;
const summaryTotalPercentage = document.getElementById(
  "summaryTotalPercentage"
)!;

// Import/Export data
const exportDropdownBtn = document.getElementById("exportDropdownBtn");
const exportDropdown = document.getElementById("exportDropdown");

const importDropdownBtn = document.getElementById("importDropdownBtn");
const importDropdown = document.getElementById("importDropdown");

// Toggle dropdown visibility on button click
exportDropdownBtn?.addEventListener("click", () => {
  exportDropdown?.classList.toggle("active");
  // Close the other dropdown if open
  if (importDropdown?.classList.contains("active")) {
    importDropdown.classList.remove("active");
  }
});

importDropdownBtn?.addEventListener("click", () => {
  importDropdown?.classList.toggle("active");
  // Close the other dropdown if open
  if (exportDropdown?.classList.contains("active")) {
    exportDropdown.classList.remove("active");
  }
});

// Close dropdowns and modals when clicking outside
window.addEventListener("click", (event) => {
  if (!(event.target as HTMLElement).closest(".dropdown")) {
    exportDropdown?.classList.remove("active");
    importDropdown?.classList.remove("active");
  }
});
let input = document.getElementById("importDataBtn");
input?.addEventListener("change", importData);

let inputCsv = document.getElementById("importDataCsvBtn");
inputCsv?.addEventListener("change", importCsvData);

const importCsvButton = document.getElementById("importDataCsvBtn")!;
const csvInstructionsModal = <HTMLDialogElement> document.getElementById("csvInstructionsModal")!;
const csvModalCloseBtn = document.getElementById("csv-warning-close");

importCsvButton?.addEventListener("click", () => {
  if (csvInstructionsModal) {
    csvInstructionsModal.showModal();
  }
});
csvModalCloseBtn?.addEventListener("click", () => {
  csvInstructionsModal.close();
});
const downloadSampleCsv = document.getElementById("downloadSampleCsv");
if (downloadSampleCsv) {
  downloadSampleCsv.addEventListener("click", () => {
    const csvContent =
      "id,symbol,date,amount,cost,transactionType\nbitcoin,BTC,2023-10-01,0.5,25000,BUY";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    downloadSampleCsv.setAttribute("href", url);
  });
}
// Summary number animations
let summaryTotalValueContentCountUp = new CountUp(summaryTotalValueContent, 0, {
  decimalPlaces: 2,
  duration: 1,
});

//
// Search modal -----------------------------------
//
const openSearchModal = () => {
  if (!searchModal) return;

  searchModal.showModal();

  // Clear the crypto list
  const cryptoListDiv = document.getElementById("cryptoList");
  if (cryptoListDiv) {
    cryptoListDiv.innerHTML = "";
  }
};

searchModalCloseBtn?.addEventListener("click", (e) => {
  e?.preventDefault();
  closeSearchModal();
});

function closeSearchModal() {
  if (!searchModal || !searchForm) return;

  searchModal.close();
  searchForm.reset();
}

// Event listeners
addCryptoBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  openSearchModal();
});

searchModalCloseBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  closeSearchModal();
});
//
// -------------------------------------------------------------
//

//
// Transaction Modal-------------------------------------------------------------
//

transactionModalCloseBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  closeTransactionModal();
});

manageTransactionsModalCloseBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  closeManageTransactionsModal();
});

editTransactionModalCloseBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  closeEditTransactionModal();
});

function closeTransactionModal() {
  if (!transactionModal || !transactionForm) return;
  transactionForm.reset();
  transactionModal.close();
}

function closeManageTransactionsModal() {
  if (!manageTransactionsModal) return;
  manageTransactionsModal.close();
}

function closeEditTransactionModal() {
  if (!editTransactionModal) return;
  editTransactionModal.close();
}

document.getElementById("searchForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  searchCrypto();
});

function searchCrypto() {
  const input = document.querySelector<HTMLInputElement>(
    "#crypto-search-input"
  )!;
  const cryptoListDiv = document.getElementById("cryptoList")!;
  // Clear the list when entering a new search
  cryptoListDiv.innerHTML = "";

  // Do a search request to coingecko, passing the searchterm
  // take the coins section returned and display it
  getCoins(input.value).then((data) => {
    if (data.length === 0) {
      return;
    }

    for (let c in data) {
      let coinDiv = document.createElement("div");
      let thumbnail = document.createElement("img");
      thumbnail.src = data[c]["large"];
      let name = document.createElement("p");
      name.textContent = data[c]["name"];
      coinDiv.appendChild(thumbnail);
      coinDiv.appendChild(name);

      // When selecting a certain coin, clear the popup and continue with the coin selected
      coinDiv.onclick = function (e) {
        e.preventDefault();
        closeSearchModal();
        startTransaction({
          id: data[c]["id"],
          symbol: data[c]["symbol"],
          name: data[c]["name"],
          thumbnail: data[c]["large"],
        });
      };
      cryptoListDiv.appendChild(coinDiv);
    }
  });
}

function startTransaction(coin: Coin) {
  // Switch the modal popup to the transaction popup
  transactionModal.showModal();

  const toggleTransactionType = document.getElementById(
    "toggleTransactionType"
  )!;
  const buyTransactionBtn = document.getElementById("buyTransactionBtn")!;
  const sellTransactionBtn = document.getElementById("sellTransactionBtn")!;
  const addTransactionBtn = document.getElementById("addTransactionBtn")!;
  const transactionTitle = document.getElementById("transactionModalTitle")!;

  const transactionDate = <HTMLInputElement>(
    document.getElementById("transactionDate")
  );
  const availableAmount = <HTMLInputElement>(
    document.getElementById("availableAmount")
  );
  const transactionAmount = <HTMLInputElement>(
    document.getElementById("transactionAmount")
  );
  const transactionCost = <HTMLInputElement>(
    document.getElementById("transactionCost")
  );

  // Reset invalid button styling
  addTransactionBtn.style.animation = "";
  addTransactionBtn.style.boxShadow = "";

  // Reset the toggle transactions buttons
  buyTransactionBtn.classList.remove("active");
  buyTransactionBtn.classList.add("active");
  sellTransactionBtn.classList.remove("active");
  availableAmount.textContent = "";
  transactionAmount.removeAttribute("max");

  // Check if the crypto is present in our holdings, otherwise we disable toggling between buy/sell
  let foundCrypto = cryptocurrencies.find((c) => c.id === coin.id);
  if (foundCrypto !== undefined) {
    sellTransactionBtn.style.opacity = "1";

    toggleTransactionType.onclick = () => {
      buyTransactionBtn.classList.toggle("active");
      sellTransactionBtn.classList.toggle("active");

      // If it's a Sell transaction, fill in the available amount
      if (sellTransactionBtn.classList.contains("active")) {
        transactionAmount.max = String(foundCrypto?.totalAmount);
        availableAmount.textContent = `${foundCrypto?.totalAmount} ${foundCrypto?.symbol} available`;
      } else {
        availableAmount.textContent = "";
        transactionAmount.removeAttribute("max");
      }
    };
  } else {
    sellTransactionBtn.style.opacity = "0.2";
    // Reset the onclick listener if the crypto is not found so we can't toggle
    toggleTransactionType.onclick = null;
  }

  // Set the date input to today by default
  transactionDate.valueAsDate = new Date();

  transactionTitle.textContent = coin.name;

  addTransactionBtn.onclick = (e) => {
    e.preventDefault();

    // Validate the form
    if (
      Number(transactionAmount.value) <= 0 ||
      Number(transactionCost.value) <= 0 ||
      (transactionAmount.hasAttribute("max") &&
        Number(transactionAmount.max) < Number(transactionAmount.value))
    ) {
      // Show an error animation on the add transaction button
      addTransactionBtn.style.animation = "shake 0.2s ease-in-out 0s 2";
      addTransactionBtn.style.boxShadow = "0 0 0.6rem #ff0000";

      return;
    }

    // Create the cryptocurrency object
    let resultCrypto = cryptocurrencies.find((c) => c.id === coin.id);
    let selectedTransactionType = buyTransactionBtn.classList.contains("active")
      ? transactionType.Buy
      : transactionType.Sell;
    // If crypto was already present, add new transaction
    if (resultCrypto) {
      resultCrypto.addTransaction(
        new Transaction(
          selectedTransactionType,
          new Date(transactionDate.value),
          Number(transactionAmount.value),
          Number(transactionCost.value)
        )
      );
    } else {
      // If crypto was not yet present, create it and add new transaction
      let newCrypto = new CryptoCurrency(
        coin.id,
        coin.symbol,
        coin.name,
        coin.thumbnail
      );
      cryptocurrencies.push(newCrypto);

      newCrypto.addTransaction(
        new Transaction(
          selectedTransactionType,
          new Date(transactionDate.value),
          Number(transactionAmount.value),
          Number(transactionCost.value)
        )
      );
    }
    // Persist the data
    saveData();

    // Close the transaction modal when done
    closeTransactionModal();
    init();
  };
}
function manageTransactions(coin: Coin) {
  // Switch the modal popup to the transaction popup
  manageTransactionsModal.showModal();

  const manageTransactionsTitle = document.getElementById(
    "manageTransactionsModalTitle"
  )!;
  manageTransactionsTitle.textContent = coin.name;

  let crypto = cryptocurrencies.find((c) => c.id === coin.id);
  if (crypto) {
    refreshManageTransactions(crypto);
  }
}

function refreshManageTransactions(crypto: CryptoCurrency) {
  const manageTransactionsTableBody = document.getElementById(
    "manageTransactionsTableBody"
  )!;

  // Remove the table body completely
  while (manageTransactionsTableBody.children.length > 0) {
    if (manageTransactionsTableBody.firstChild)
      manageTransactionsTableBody.removeChild(
        manageTransactionsTableBody.firstChild
      );
  }

  for (const transaction of crypto.transactions) {
    let tr = document.createElement("tr");

    /*
        TODO: Remove button will show a cancel/confirm button first before removing
    */
    tr.innerHTML = `
      <td>${transaction.date.toLocaleDateString()}</td>
      <td>${transactionType[transaction.type]}</td>
      <td title="${transaction.amount}">${humanReadableNumber(transaction.amount)} ${crypto.symbol}</td>
      <td>${transaction.cost.toFixed(2)} USD</td>
      <td class="assetsTableBtns">
          <button id="manageTransactionsTableEditBtn" class="fa-solid fa-pen-to-square iconBtn"></button>
          <button id="manageTransactionsTableRemoveBtn" class="fa-solid fa-trash-can iconBtn"></button>
      </td>
    `;
    const editBtn = tr.querySelector<HTMLButtonElement>(
      "#manageTransactionsTableEditBtn"
    );
    const removeBtn = tr.querySelector<HTMLButtonElement>(
      "#manageTransactionsTableRemoveBtn"
    );
    if (removeBtn) {
      removeBtn.onclick = () => {
        if (!crypto) return;

        crypto.removeTransaction(transaction);

        // If after removing the transactio the crypto has no transactions left, remove the crypto
        if (
          crypto.amountOfTransactions < 1 ||
          crypto.amountOfTransactions === undefined
        ) {
          cryptocurrencies.splice(cryptocurrencies.indexOf(crypto), 1);
        }

        // Persist the data
        saveData();

        closeManageTransactionsModal();
        init();
      };
    }
    if (editBtn) {
      editBtn.onclick = () => {
        if (!crypto) return;
        closeTransactionModal();
        editTransaction(crypto, transaction);
      };
    }
    manageTransactionsTableBody.appendChild(tr);
  }
}

function editTransaction(crypto: CryptoCurrency, transaction: Transaction) {
  editTransactionModal.showModal();

  const editTransactionTitle = document.getElementById(
    "editTransactionModalTitle"
  )!;
  const toggleTransactionType = document.getElementById(
    "editToggleTransactionType"
  )!;
  const buyTransactionBtn = document.getElementById("editBuyTransactionBtn")!;
  const sellTransactionBtn = document.getElementById("editSellTransactionBtn")!;
  const editTransactionBtn = document.getElementById("editTransactionBtn")!;

  // Prepare the modal
  editTransactionTitle.textContent = crypto.name;
  buyTransactionBtn.classList.remove("active");
  sellTransactionBtn.classList.remove("active");

  toggleTransactionType.onclick = () => {
    buyTransactionBtn.classList.toggle("active");
    sellTransactionBtn.classList.toggle("active");
  };

  // Fill in the form values
  const transactionDate = <HTMLInputElement>(
    document.getElementById("editTransactionDate")
  );
  const transactionAmount = <HTMLInputElement>(
    document.getElementById("editTransactionAmount")
  );
  const transactionCost = <HTMLInputElement>(
    document.getElementById("editTransactionCost")
  );

  transaction.type === transactionType.Buy
    ? buyTransactionBtn.classList.add("active")
    : sellTransactionBtn.classList.add("active");
  transactionDate.valueAsDate = transaction.date;
  transactionAmount.value = String(transaction.amount);
  transactionCost.value = String(transaction.cost);

  // Add btn listener on save where the values get updated
  editTransactionBtn.onclick = (e) => {
    e.preventDefault();

    // let selectedTransactionType = buyTransactionBtn.classList.contains("active") ? transactionType.Buy : transactionType.Sell;
    let currentCrypto = cryptocurrencies.find((c) => c.id === crypto.id);
    let selectedTransactionType = buyTransactionBtn.classList.contains("active")
      ? transactionType.Buy
      : transactionType.Sell;

    if (currentCrypto) {
      // selectedTransactionType, new Date(transactionDate.value), Number(transactionAmount.value), Number(transactionCost.value)
      currentCrypto.editTransaction(
        new Transaction(
          selectedTransactionType,
          new Date(transactionDate.value),
          Number(transactionAmount.value),
          Number(transactionCost.value),
          transaction.uuid
        )
      );
      refreshManageTransactions(currentCrypto);
    }
    closeEditTransactionModal();
    saveData();
    init();
  };
}

async function populateAssetsTableAndSummary() {
  const tableBody = document.getElementById("assetsTableBody")!;

  if (cryptocurrencies.length === 0) {
    summaryTotalValueContent.textContent = ``;
    summaryTotalPercentage.textContent = `%`;
    // Clear the table
    while (tableBody.children.length > 0) {
      if (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
      }
    }
    return;
  }

  const coinPrices = await getCoinsPrices(cryptocurrencies.map((c) => c.id));
  // When we overload the coingecko api, we get a 429 and empty objects back
  // In this case we stop what we are doing and tell the user to slow down
  if (coinPrices.length === 0) {
    return;
  }

  // Removing it with a while loop is better than innerHTML = ""
  while (tableBody.children.length > 0) {
    if (tableBody.firstChild) {
      tableBody.removeChild(tableBody.firstChild);
    }
  }

  let cryptoValueSum = 0;
  let cryptoBuyCostSum = 0;
  let cryptoSellCostSum = 0;

  const sortedCryptocurrencies = cryptocurrencies.sort((a, b) => {
    const cryptoValueA = parseFloat(coinPrices[a.id]["usd"]) * a.totalAmount;
    const cryptoValueB = parseFloat(coinPrices[b.id]["usd"]) * b.totalAmount;
    return cryptoValueB - cryptoValueA; // Sort by value descending
  });

  sortedCryptocurrencies.forEach((asset) => {
    const cryptoValue =
      parseFloat(coinPrices[asset.id]["usd"]) * asset.totalAmount;
    const gain = cryptoValue + asset.totalSellCost - asset.totalBuyCost;
    const gainInPercentage = (gain / asset.totalBuyCost) * 100;

    cryptoValueSum += cryptoValue;
    cryptoBuyCostSum += asset.totalBuyCost;
    cryptoSellCostSum += asset.totalSellCost;

    let tr = document.createElement("tr");

    // When we have no current holdings, skip coin
    if (asset.totalAmount === 0) return;

    tr.innerHTML = `
        <td>${asset.name}</td>
        <td>$${asset.averageBuyPrice.toFixed(2)}</td>
        <td title="${asset.totalAmount}">${humanReadableNumber(asset.totalAmount)} ${asset.symbol}</td>
        <td>$${humanReadableNumber(asset.totalCost)}</td>
        <td>$${humanReadableNumber(cryptoValue)}</td>
        <td>${gainInPercentage.toFixed(2)}%</td>
        <td class="assetsTableBtns">
            <button id="assetsTableAdd" class="fa fa-plus-minus iconBtn"></button>
            <button id="assetsTableManage" class="fa-solid fa-pen-to-square iconBtn"></button>
        </td>
      `;

    const addButton = tr.querySelector<HTMLButtonElement>("#assetsTableAdd");
    if (addButton) {
      addButton.onclick = () =>
        startTransaction({
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          thumbnail: asset.thumbnail,
        });
    }
    const manageButton =
      tr.querySelector<HTMLButtonElement>("#assetsTableManage");
    if (manageButton) {
      manageButton.onclick = () =>
        manageTransactions({
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          thumbnail: asset.thumbnail,
        });
    }

    tableBody?.appendChild(tr);
  });

  // Fill up the summary values
  // summaryTotalValueContent.textContent = `${cryptoValueSum ? cryptoValueSum.toFixed(2) : ""}`;
  summaryTotalValueContentCountUp.update(cryptoValueSum);

  const percentage =
    ((cryptoValueSum + cryptoSellCostSum - cryptoBuyCostSum) /
      cryptoBuyCostSum) *
    100;
  summaryTotalPercentage.textContent = `${
    percentage ? percentage.toFixed(2) : ""
  }%`;

  if (summaryTotalValue) summaryTotalValue.style.opacity = "0.5";
  if (summaryTotalValue) summaryTotalPercentage.style.opacity = "0.5";
}
// Run the populate assetsTableAndSummary every x minutes -> 15 minutes or 900 000ms in this case: 15m*60s*1000ms
// ToDO: make the x minutes configurable? with a minimum amount of 1 minute to not overload the coingecko API
setInterval(populateAssetsTableAndSummary, 900000);

export function init() {
  populateAssetsTableAndSummary();
  renderCharts();
}

export function humanReadableNumber(value: number): string {
  if (value >= 100){
    return value.toFixed(0);
  } else if (value >= 1) {
    return value.toFixed(2);
  } else {
    return value.toFixed(4);
  }
}

loadData();
init();
