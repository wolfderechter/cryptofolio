import { Coin, CryptoCurrency } from "./cryptocurrency";
import {
  saveData,
  loadData,
  exportData,
  importData,
} from "./data/localstorage";
import { getCoins, getCoinsPrices } from "./data/Coingecko";
import { Transaction, transactionType } from "./Transaction";
import { renderCharts } from "./charts/Init";

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

let input = document.getElementById("importDataBtn");
if (input) input.addEventListener("change", importData);

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
          transactionType.Buy,
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
          transactionType.Buy,
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
    calculateStakingRewards();
  };
}

async function populateAssetsTable() {
  const tableBody = document.getElementById("assetsTableBody")!;
  // Removing it with a while loop is better than innerHTML = ""
  while (tableBody.children.length > 0) {
    if (tableBody.firstChild) {
      tableBody.removeChild(tableBody.firstChild);
    }
  }

  const coinPrices = await getCoinsPrices(cryptocurrencies.map((c) => c.id));

  if (cryptocurrencies.length === 0) return;

  cryptocurrencies.forEach((asset) => {
    const cryptoValue =
      parseFloat(coinPrices[asset.id].usd) * asset.totalAmount;
    const percentage =
      ((cryptoValue - asset.totalCost) / asset.totalCost) * 100;

    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${asset.name}</td>
      <td>$${asset.averagePrice.toFixed(2)}</td>
      <td>${asset.totalAmount} ${asset.symbol}</td>
      <td>$${asset.totalCost}</td>
      <td>$${cryptoValue.toFixed(2)}</td>
      <td>${percentage.toFixed(2)}%</td>
      <td class="assetsTableBtns">
          <button id="assetsTableAdd" class="fa fa-plus assetsTableBtn"></button>
          <button id="assetsTableManage" class="fa fa-pencil-square-o assetsTableBtn"></button>
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

    tableBody?.appendChild(tr);
  });
}

export function init() {
  populateAssetsTable();
  renderCharts();
}
loadData();
init();

exportData(); // Setup the exportDataBtn so it's ready upon click

/* 
  Staking rewards for ethereum can be defined as the gain in USD since buying the LSD rETH/...

  => Can be caluclated by comparing the current value of the LSD coin to the value of the coin at the time of buying

*/
const STAKED_ETH_COINS = ["rocket-pool-eth", "wrapped-steth"];
async function calculateStakingRewards() {
  let totalRewards = 0;
  let totalStaked = 0;
  let stakedETH = false;
  const ethereumStaking = document.getElementById("ethereumStaking")!;
  const ethereumStakedAmount = document.getElementById("ethereumStakedAmount");
  const ethereumStakingTotalRewards = document.getElementById(
    "ethereumStakingTotalRewards"
  );
  for (const cc of cryptocurrencies) {
    if (STAKED_ETH_COINS.includes(cc.id)) {
      stakedETH = true;
      let coinPrice = await getCoinsPrices([cc.id]);
      let currentValue = coinPrice[cc.id].usd;

      // Add the current dollar value staked to the total
      totalStaked += cc.totalAmount * currentValue;

      // Calculate the difference in current dollar value minus the total cost spent in dollar
      let reward = cc.totalAmount * currentValue - cc.totalCost;
      if (reward > 0) totalRewards += reward;
    }

    // Hide the staked ethereum card if no staked eth is found
    if (!stakedETH) {
      ethereumStaking.style.display = "none";
    } else {
      ethereumStaking.style.display = "flex";
    }

    if (ethereumStakedAmount && ethereumStakingTotalRewards) {
      ethereumStakedAmount.textContent = `${totalStaked.toFixed(2)}`;
      ethereumStakingTotalRewards.textContent = `${totalRewards.toFixed(2)}`;
    }
  }
}
calculateStakingRewards();
