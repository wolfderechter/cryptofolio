import { Coin, CryptoCurrency } from "./cryptocurrency";
import {
  saveData,
  loadData,
  importData,
  importCsvData,
} from "./data/localstorage";
import { getCoinOnDate, getCoins, getCoinsPrices } from "./data/coingecko";
import { Transaction, transactionType } from "./transaction";
import { renderCharts } from "./charts/init";
import { CountUp } from "countup.js";

export const cryptocurrencies: CryptoCurrency[] = [];
// Used for sleeping after API requests to prevent being rate limited. In ms.
export let SLEEP_TIME = 2500;

const addCryptoBtn = document.querySelector<HTMLButtonElement>("#addCrypto");

// Modals
const searchModal = document.getElementById("seach-modal")!;
const transactionModal = document.getElementById("transaction-modal")!;
const manageTransactionsModal = document.getElementById(
  "manage-transactions-modal"
)!;
const editTransactionModal = document.getElementById("edit-transaction-modal")!;

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

// Staking
const ethereumStaking = document.getElementById("ethereumStaking")!;
const ethereumStakedAmount = document.getElementById("ethereumStakedAmount")!;
const ethereumStakingTotalRewards = document.getElementById(
  "ethereumStakingTotalRewards"
)!;
const ethereumStakingTotalRewardsContent = document.getElementById(
  "ethereumStakingTotalRewardsContent"
)!;
const ethereumStakingDailyRewards = document.getElementById(
  "ethereumStakingDailyRewards"
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
const csvInstructionsModal = document.getElementById("csvInstructionsModal")!;
const csvModalCloseBtn = document.getElementById("csv-warning-close");

importCsvButton?.addEventListener("click", () => {
  if (csvInstructionsModal) {
    csvInstructionsModal.style.display = "block";
  }
});
csvModalCloseBtn?.addEventListener("click", () => {
    csvInstructionsModal.style.display = "none";
});
// Close the modal when clicking outside of it
window.addEventListener("click", (event) => {
  if (event.target === csvInstructionsModal) {
    csvInstructionsModal.style.display = "none";
  }
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

// Staking rewards animations
let ethereumStakingTotalRewardsCountUp = new CountUp(
  ethereumStakingTotalRewardsContent,
  0,
  {
    decimalPlaces: 4,
    duration: 1,
  }
);

//
// Search modal -----------------------------------
//
const openSearchModal = () => {
  if (!searchModal) return;

  // Clear the crypto list
  const cryptoListDiv = document.getElementById("cryptoList");
  if (cryptoListDiv) {
    cryptoListDiv.innerHTML = "";
  }

  // Show modal
  searchModal.style.display = "block";

  // Add escape key listener
  window.addEventListener("keydown", handleEscapeKeySearchModal);
};

const handleEscapeKeySearchModal = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    closeSearchModal();
  }
};

searchModalCloseBtn?.addEventListener("click", (e) => {
  e?.preventDefault();
  closeSearchModal();
});

function closeSearchModal() {
  if (!searchModal || !searchForm) return;

  // Hide modal and reset form to clean state
  searchModal.style.display = "none";
  searchForm.reset();

  // Remove escape key listener
  window.removeEventListener("keydown", handleEscapeKeySearchModal);
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
const handleEscapeKeyTransactionModal = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    closeTransactionModal();
  }
};
const handleEscapeKeyManageTransactionModal = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    closeManageTransactionsModal();
  }
};
const handleEscapeKeyEditTransactionModal = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    closeEditTransactionModal();
  }
};

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

  transactionModal.style.display = "none";
  transactionForm.reset();

  // Remove escape key listener
  window.removeEventListener("keydown", handleEscapeKeyTransactionModal);
}

function closeManageTransactionsModal() {
  if (!manageTransactionsModal) return;

  manageTransactionsModal.style.display = "none";

  // Remove escape key listener
  window.removeEventListener("keydown", handleEscapeKeyManageTransactionModal);
}

function closeEditTransactionModal() {
  if (!editTransactionModal) return;

  editTransactionModal.style.display = "none";

  // Remove escape key listener
  window.removeEventListener("keydown", handleEscapeKeyEditTransactionModal);
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
  transactionModal.style.display = "block";

  // Add escape key listener
  window.addEventListener("keydown", handleEscapeKeyTransactionModal);

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
  manageTransactionsModal.style.display = "block";

  window.addEventListener("keydown", handleEscapeKeyManageTransactionModal);

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
        ToDO: Remove button will show a cancel/confirm button first before removing
    */
    tr.innerHTML = `
      <td>${transaction.date.toLocaleDateString()}</td>
      <td>${transactionType[transaction.type]}</td>
      <td>${transaction.amount} ${crypto.symbol}</td>
      <td>${transaction.cost} USD</td>
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
  editTransactionModal.style.display = "block";

  window.addEventListener("keydown", handleEscapeKeyEditTransactionModal);

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

  cryptocurrencies.forEach((asset) => {
    const cryptoValue =
      parseFloat(coinPrices[asset.id]["usd"]) * asset.totalAmount;
    const gain = cryptoValue + asset.totalSellCost - asset.totalBuyCost;
    const gainInPercentage = (gain / asset.totalBuyCost) * 100;

    cryptoValueSum += cryptoValue;
    cryptoBuyCostSum += asset.totalBuyCost;
    cryptoSellCostSum += asset.totalSellCost;

    let tr = document.createElement("tr");

    // When we sold everything
    if (asset.totalAmount === 0) {
      tr.innerHTML = `
      <td>${asset.name}</td>
      <td>$${asset.averageBuyPrice.toFixed(2)}</td>
      <td>${asset.totalAmount} ${asset.symbol}</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td class="assetsTableBtns">
          <button id="assetsTableAdd" class="fa fa-plus iconBtn"></button>
          <button id="assetsTableManage" class="fa-solid fa-pen-to-square iconBtn"></button>
      </td>
    `;
    } else {
      // If the totalCost < 0 just show 0 => we made all our investments back by selling.
      tr.innerHTML = `
        <td>${asset.name}</td>
        <td>$${asset.averageBuyPrice.toFixed(2)}</td>
        <td>${asset.totalAmount} ${asset.symbol}</td>
        <td>$${asset.totalCost > 0 ? asset.totalCost : 0}</td>
        <td>$${cryptoValue.toFixed(2)}</td>
        <td>${gainInPercentage.toFixed(2)}%</td>
        <td class="assetsTableBtns">
            <button id="assetsTableAdd" class="fa fa-plus-minus iconBtn"></button>
            <button id="assetsTableManage" class="fa-solid fa-pen-to-square iconBtn"></button>
        </td>
      `;
    }

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

/*
  Staking rewards for ethereum can be defined as the gain in USD since buying the LSD rETH/...

  => added staking value can be calculated by comparing the conversion rate at the time of buying to the current conversion rate*
  => Added staking value = ((eth/reth conversion rate now) - (eth/reth conversion rate at time of buying)) * amount of rETH held
    -> This should be calculated for each transaction individually and summed up

  *Assumes the conversion rate only goes up, but as we know it fluctuates so short-term it might be negative, in which case we show 0 rewards
   Long term it should be positive and upwards

  **In case of sales: calculate the rewards for the reth amount up until the sale, calculate the remaining reth rewards up until the next sale or until now.
     => use FIFO basically
     => can be simplified by starting at the beginning and checking for each transaction if a sale is coming
        - if a sale is coming calculate the rewards up until the sale for the whole amount
        - calculate the rewards for the remaining amount from after the sale up until the next sale or until now

  Additional Remarks:
    Tracking eth staking only makes sense by comparing the peg of date of staking and current date. The difference in the peg tells us the rewards.
    Since the peg is between reth/eth we need to know how much eth we are essentially staking into reth.
    -If we know the eth amount, easy
      => Need to support ETH as the transaction currency for staking
    -If we don't know the eth amount, we can look it up for the date but it needs to be precise so exact timestamp (including hour/minutes).

    Also we need to be aware of fees when swapping, possibly we could store these in the transactions.
*/
const STAKED_ETH_COINS = ["rocket-pool-eth", "wrapped-steth"];
async function calculateStakingRewards() {
  // let totalRewardsETH = 0;
  let totalRewardsUSD = 0;
  let totalStakedUSD = 0;
  let stakedETH = false;

  // In case no cryptocurrencies are present (anymore) we set the boolean to false and exit
  if (cryptocurrencies.length < 1) stakedETH = false;
  let limited = false;

  for (const cc of cryptocurrencies) {
    if (STAKED_ETH_COINS.includes(cc.id)) {
      stakedETH = true;
      let coinPrice = await getCoinsPrices([cc.id, "ethereum"]); // the prices of the staked eth LSD and ethereum to use later on
      if (coinPrice.length === 0) {
        limited = true;
        break;
      }

      let currentValue = coinPrice[cc.id]["usd"]; // the value of the staked eth LSD in USD for ease of access

      // Add the current dollar value staked to the total
      totalStakedUSD += cc.totalAmount * currentValue;

      // Loop through the transactions and calculate the rewards for each BUY transaction individually
      for (const transaction of cc.transactions) {
        // Fetch the coin price on the date of the purchase
        let coinOnPurchaseDate = await getCoinOnDate(
          cc.id,
          transaction.date.toLocaleDateString("NL") // using .toLocaleDateString("NL") because it outputs the string in dd-mm-yyyy format
        );
        let ethOnPurchaseDate = await getCoinOnDate(
          "ethereum",
          transaction.date.toLocaleDateString("NL") // using .toLocaleDateString("NL") because it outputs the string in dd-mm-yyyy format
        );
        if (coinOnPurchaseDate.length === 0) {
          limited = true;
          break;
        }
        // Calculates the conversion rate based on the amount received and total cost so the actual conversion rate is calculated including the premium present (and fees)
        let conversionRateOnDate =
          transaction.cost / (transaction.amount * ethOnPurchaseDate["usd"]);

        // Calculate the reward by multiplying the transaction amount with the delta of conversion rate from date of purchase vs now
        let rewardETH =
          transaction.amount * (coinPrice[cc.id]["eth"] - conversionRateOnDate);
        let rewardUSD = rewardETH * coinPrice["ethereum"]["usd"]; // convert the eth rewards to usd by multiplying by the price of ETH now

        // Alternatively, calculate use the official conversion rate on the day of staking
        // This isn't always accurate since there can be premiums
        // let rewardETH = transaction.amount * (coinPrice[cc.id]["eth"] - parseFloat(coinOnPurchaseDate["eth"]));
        // let rewardUSD = rewardETHV1 * coinPrice["ethereum"]["usd"];

        // if (rewardETH > 0) totalRewardsETH += rewardETH;
        if (rewardUSD > 0) totalRewardsUSD += rewardUSD;
      }
    }
  }
  // If we are being rate limited, exit
  if (limited) return;

  // Hide the staked ethereum card if no staked eth is found
  if (!stakedETH) {
    ethereumStaking.style.display = "none";
  } else {
    ethereumStaking.style.display = "flex";
  }

  if (
    ethereumStakedAmount &&
    ethereumStakingTotalRewards &&
    ethereumStakingDailyRewards
  ) {
    ethereumStakedAmount.textContent = `${totalStakedUSD.toFixed(2)} USD`;
    // ethereumStakingTotalRewards.textContent = `${totalRewardsUSD.toFixed(4)} USD`;
    ethereumStakingTotalRewardsCountUp.update(totalRewardsUSD);

    /*
      Eth staking rewards of the last 24h can be calculated with:
        1) multiply the total staked eth with the apr for 24h
        2) calculate the rewards between yesterday and now for each holding and sum it up
           => can be unreliable because reth can change quite a bit daily and is better for long term
    */
    //  ToDo: change hardcoded eth staking apy to something dynamic
    let dailyRewardsUSD = (totalStakedUSD * 0.045) / 365;
    ethereumStakingDailyRewards.textContent = `${dailyRewardsUSD.toFixed(
      4
    )} USD`;

    let stakingInterval: ReturnType<typeof setInterval> | undefined;
    ethereumStakingTotalRewards.onmouseenter = () => {
      // Increase the decimal places and duration while hovering
      ethereumStakingTotalRewardsCountUp.options!.decimalPlaces = 10;
      ethereumStakingTotalRewardsCountUp.options!.duration = 2.5;

      let value = totalRewardsUSD;
      stakingInterval = setInterval(() => {
        // ToDO: Convert the hardcoded APY of reth/wstETH to something better
        value += value * (0.043 / 365 / 24 / 60 / 60);
        ethereumStakingTotalRewardsCountUp.update(value);
      }, 1000);
    };
    ethereumStakingTotalRewards.onmouseleave = () => {
      // Decrease the decimal places and duration when leaving
      ethereumStakingTotalRewardsCountUp.options!.decimalPlaces = 4;
      ethereumStakingTotalRewardsCountUp.options!.duration = 1;

      clearInterval(stakingInterval!);
    };
  }
}

export function init() {
  populateAssetsTableAndSummary();
  renderCharts();
  calculateStakingRewards();
}
loadData();
init();
