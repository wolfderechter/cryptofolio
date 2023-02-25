import { Coin, CryptoCurrency } from "./cryptocurrency";
import { saveData, loadData, exportData, importData } from "./data/localstorage";
import { getCoinOnDate, getCoins, getCoinsPrices } from "./data/Coingecko";
import { Transaction, transactionType } from "./Transaction";
import { renderCharts } from "./charts/Init";

export const cryptocurrencies: CryptoCurrency[] = [];
const addCryptoBtn = document.querySelector<HTMLButtonElement>("#addCrypto");
const searchModal = document.getElementById("seach-modal")!;
const transactionModal = document.getElementById("transaction-modal")!;
const manageTransactionsModal = document.getElementById("manage-transactions-modal")!;
const searchModalCloseBtn = document.getElementById("search-modal-close");
const transactionModalCloseBtn = document.getElementById("transaction-modal-close");
const manageTransactionsModalCloseBtn = document.getElementById("manage-transactions-modal-close");
const searchForm = document.querySelector<HTMLFormElement>("#searchForm");
const transactionForm = document.querySelector<HTMLFormElement>("#transactionForm");

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

manageTransactionsModalCloseBtn?.addEventListener("click", (e) => {
  closeManageTransactionsModal(e);
});

function closeManageTransactionsModal(e?: MouseEvent) {
  e?.preventDefault();
  if (manageTransactionsModal) {
    manageTransactionsModal.style.display = "none";
  }
}

document.getElementById("searchForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  searchCrypto();
});

function searchCrypto() {
  const input = document.querySelector<HTMLInputElement>("#crypto-search-input")!;
  // const innerModal = document.getElementById("inner-modal-content")!;
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
        });
      };
      cryptoListDiv.appendChild(coinDiv);
    }
  });
}

function startTransaction(coin: Coin) {
  // Switch the modal popup to the transaction popup
  transactionModal.style.display = "block";

  const toggleTransactionType = document.getElementById("toggleTransactionType")!;
  const buyTransactionBtn = document.getElementById("buyTransactionBtn")!;
  const sellTransactionBtn = document.getElementById("sellTransactionBtn")!;
  const addTransactionBtn = document.getElementById("addTransactionBtn")!;
  const transactionTitle = document.getElementById("transactionModalTitle")!;

  const transactionDate = <HTMLInputElement>document.getElementById("transactionDate");
  const availableAmount = <HTMLInputElement>document.getElementById("availableAmount");
  const transactionAmount = <HTMLInputElement>document.getElementById("transactionAmount");
  const transactionCost = <HTMLInputElement>document.getElementById("transactionCost");

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
      (transactionAmount.hasAttribute("max") && Number(transactionAmount.max) < Number(transactionAmount.value))
    ) {
      // Show an error animation on the add transaction button
      addTransactionBtn.style.animation = "shake 0.2s ease-in-out 0s 2";
      addTransactionBtn.style.boxShadow = "0 0 0.6rem #ff0000";

      return;
    }

    // Create the cryptocurrency object
    let resultCrypto = cryptocurrencies.find((c) => c.id === coin.id);
    let selectedTransactionType = buyTransactionBtn.classList.contains("active") ? transactionType.Buy : transactionType.Sell;
    // If crypto was already present, add new transaction
    if (resultCrypto) {
      resultCrypto.addTransaction(
        new Transaction(selectedTransactionType, new Date(transactionDate.value), Number(transactionAmount.value), Number(transactionCost.value))
      );
    } else {
      // If crypto was not yet present, create it and add new transaction
      let newCrypto = new CryptoCurrency(coin.id, coin.symbol, coin.name);
      cryptocurrencies.push(newCrypto);

      newCrypto.addTransaction(
        new Transaction(
          selectedTransactionType,
          new Date((<HTMLInputElement>document.getElementById("transactionDate")).value),
          Number((<HTMLInputElement>document.getElementById("transactionAmount")).value),
          Number((<HTMLInputElement>document.getElementById("transactionCost")).value)
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

  const manageTransactionsTableBody = document.getElementById("manageTransactionsTableBody")!;
  const manageTransactionsTitle = document.getElementById("manageTransactionsModalTitle")!;
  manageTransactionsTitle.textContent = coin.name;

  // Remove the table body completely
  while (manageTransactionsTableBody.children.length > 0) {
    if (manageTransactionsTableBody.firstChild) manageTransactionsTableBody.removeChild(manageTransactionsTableBody.firstChild);
  }

  let crypto = cryptocurrencies.find((c) => c.id === coin.id);
  if (crypto) {
    for (const transaction of crypto.transactions) {
      let tr = document.createElement("tr");

      /*  ToDO: Edit button will open up and fill in a manage transaction popup with the existing values 
      
          ToDO: Remove button will show a cancel/confirm button first before removing

          Maybe add a unique ID to each transaction to identify the later on for editing/removing.
      */
      tr.innerHTML = `
        <td>${transaction.date.toLocaleDateString()}</td>
        <td>${transactionType[transaction.type]}</td>
        <td>${transaction.amount} ${coin.symbol}</td>
        <td>${transaction.cost} USD</td>
        <td class="assetsTableBtns">
            <button id="manageTransactionsTableManageBtn" class="fa-solid fa-pen-to-square iconBtn"></button>
            <button id="manageTransactionsTableRemoveBtn" class="fa-solid fa-trash-can iconBtn"></button>
        </td>
      `;
      const removeBtn = tr.querySelector<HTMLButtonElement>("#manageTransactionsTableRemoveBtn");
      if (removeBtn) {
        removeBtn.onclick = () => {
          if (!crypto) return;
          crypto.removeTransaction(transaction);

          // If after removing the transactio the crypto has no transactions left, remove the crypto
          if (crypto.amountOfTransactions < 1 || crypto.amountOfTransactions === undefined) {
            cryptocurrencies.splice(cryptocurrencies.indexOf(crypto), 1);
          }

          // Persist the data
          saveData();

          closeManageTransactionsModal();
          init();
        };
      }
      manageTransactionsTableBody.appendChild(tr);
    }
  }
}

async function populateAssetsTable() {
  const tableBody = document.getElementById("assetsTableBody")!;

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

  if (cryptocurrencies.length === 0) return;

  cryptocurrencies.forEach((asset) => {
    const cryptoValue = parseFloat(coinPrices[asset.id].usd) * asset.totalAmount;
    const percentage = ((cryptoValue - asset.totalCost) / asset.totalCost) * 100;

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
        <td>${percentage.toFixed(2)}%</td>
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
        });
    }
    const manageButton = tr.querySelector<HTMLButtonElement>("#assetsTableManage");
    if (manageButton) {
      manageButton.onclick = () =>
        manageTransactions({
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
        });
    }

    tableBody?.appendChild(tr);
  });
}

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

*/
const STAKED_ETH_COINS = ["rocket-pool-eth", "wrapped-steth"];
async function calculateStakingRewards() {
  // let totalRewardsETH = 0;
  let totalRewardsUSD = 0;
  let totalStakedUSD = 0;
  let stakedETH = false;
  const ethereumStaking = document.getElementById("ethereumStaking")!;
  const ethereumStakedAmount = document.getElementById("ethereumStakedAmount");
  const ethereumStakingTotalRewards = document.getElementById("ethereumStakingTotalRewards");
  const ethereumStakingDailyRewards = document.getElementById("ethereumStakingDailyRewards");

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
        if (coinOnPurchaseDate.length === 0) {
          limited = true;
          break;
        }

        // Calculate the reward by multiplying the transaction amount with the delta of conversion rate from date of purchase vs now
        let rewardETH = transaction.amount * (coinPrice[cc.id]["eth"] - parseFloat(coinOnPurchaseDate["eth"]));
        let rewardUSD = rewardETH * coinPrice["ethereum"]["usd"]; // convert the eth rewards to usd by multiplying by the price of ETH now

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

  if (ethereumStakedAmount && ethereumStakingTotalRewards && ethereumStakingDailyRewards) {
    ethereumStakedAmount.textContent = `${totalStakedUSD.toFixed(2)} USD`;
    ethereumStakingTotalRewards.textContent = `${totalRewardsUSD.toFixed(4)} USD`;

    /*
      Eth staking rewards of the last 24h can be calculated with:
        1) multiply the total staked eth with the apr for 24h
        2) calculate the rewards between yesterday and now for each holding and sum it up
           => can be unreliable because reth can change quite a bit daily and is better for long term
    */
    //  ToDo: change hardcoded eth staking apy to something dynamic
    let dailyRewardsUSD = (totalStakedUSD * 0.045) / 365;
    ethereumStakingDailyRewards.textContent = `${dailyRewardsUSD.toFixed(4)} USD`;
  }
}

export function init() {
  populateAssetsTable();
  renderCharts();
  calculateStakingRewards();
}
loadData();
init();

exportData(); // Setup the exportDataBtn so it's ready upon click
