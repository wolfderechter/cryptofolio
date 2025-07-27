import { Coin, Cryptocurrency } from "../cryptocurrency";
import { saveData } from "../data/localstorage";
import { humanReadableNumber } from "../helpers";
import { init } from "../main";
import { Transaction, transactionType } from "../transaction";
import * as store from '../data/store';

export function initTransactionModal() {
  const transactionModal = document.getElementById(
    "transaction-modal"
  ) as HTMLDialogElement;
  const manageTransactionsModal = document.getElementById(
    "manage-transactions-modal"
  ) as HTMLDialogElement;
  const editTransactionModal = document.getElementById(
    "edit-transaction-modal"
  ) as HTMLDialogElement;
  const transactionForm =
    document.querySelector<HTMLFormElement>("#transactionForm");
  const transactionModalCloseBtn = document.getElementById(
    "transaction-modal-close"
  );
  const manageTransactionsModalCloseBtn = document.getElementById(
    "manage-transactions-modal-close"
  );
  const editTransactionModalCloseBtn = document.getElementById(
    "edit-transaction-modal-close"
  );
  if (
    !transactionModal ||
    !manageTransactionsModal ||
    !editTransactionModal ||
    !transactionForm ||
    !transactionModalCloseBtn ||
    !manageTransactionsModalCloseBtn ||
    !editTransactionModalCloseBtn
  ) {
    console.error("Transaction modal or its elements not found.");
    return;
  }

  transactionModalCloseBtn.addEventListener("click", () => {
    transactionModal.close();
    transactionForm.reset();
  });

  manageTransactionsModalCloseBtn.addEventListener("click", () => {
    manageTransactionsModal.close();
  });

  editTransactionModalCloseBtn.addEventListener("click", () => {
    editTransactionModal.close();
  });
}

export function startTransaction(coin: Coin) {
  const transactionModal = document.getElementById(
    "transaction-modal"
  ) as HTMLDialogElement;
  transactionModal.showModal();
  const toggleTransactionType = document.getElementById(
    "toggleTransactionType"
  )!;
  const buyTransactionBtn = document.getElementById("buyTransactionBtn");
  const sellTransactionBtn = document.getElementById("sellTransactionBtn");
  const addTransactionBtn = document.getElementById("addTransactionBtn");
  const transactionTitle = document.getElementById("transactionModalTitle");
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
  if (
    !transactionModal ||
    !toggleTransactionType ||
    !buyTransactionBtn ||
    !sellTransactionBtn ||
    !addTransactionBtn ||
    !transactionTitle ||
    !transactionDate ||
    !availableAmount ||
    !transactionAmount ||
    !transactionCost
  ) {
    console.error("Transaction modal or its elements not found.");
    return;
  }

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
  const foundCrypto = store.getAssetById(coin.id);
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
    const resultCrypto = store.getAssetById(coin.id);
    const selectedTransactionType = buyTransactionBtn.classList.contains(
      "active"
    )
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
      const newCrypto = new Cryptocurrency(coin.id, coin.symbol, coin.name);
      store.addAsset(newCrypto);

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
    transactionModal.close();
    init();
  };
}

export function manageTransactions(coin: Coin) {
  const manageTransactionsModal = document.getElementById(
    "manage-transactions-modal"
  ) as HTMLDialogElement;
  // Switch the modal popup to the transaction popup
  manageTransactionsModal.showModal();

  const manageTransactionsTitle = document.getElementById(
    "manageTransactionsModalTitle"
  )!;
  manageTransactionsTitle.textContent = coin.name;

  const crypto = store.getAssetById(coin.id);
  if (crypto) {
    refreshManageTransactions(crypto);
  }
}

function refreshManageTransactions(crypto: Cryptocurrency) {
  const transactionModal = document.getElementById(
    "transaction-modal"
  ) as HTMLDialogElement;
  const manageTransactionsModal = document.getElementById(
    "manage-transactions-modal"
  ) as HTMLDialogElement;
  const manageTransactionsTableBody = document.getElementById(
    "manageTransactionsTableBody"
  );

  // Remove the table body completely
  manageTransactionsTableBody?.replaceChildren();

  for (const transaction of crypto.transactions) {
    const tr = document.createElement("tr");

    /*
        TODO: Remove button will show a cancel/confirm button first before removing
    */
    tr.innerHTML = `
      <td>${transaction.date.toLocaleDateString()}</td>
      <td>${transactionType[transaction.type]}</td>
      <td title="${transaction.amount}">${humanReadableNumber(
      transaction.amount
    )} ${crypto.symbol}</td>
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

        // If after removing the transaction the crypto has no transactions left, remove the crypto
        if (
          crypto.amountOfTransactions < 1 ||
          crypto.amountOfTransactions === undefined
        ) {
          store.removeAsset(crypto.id);
        }

        // Persist the data
        saveData();

        manageTransactionsModal.close();
        init();
      };
    }
    if (editBtn) {
      editBtn.onclick = () => {
        if (!crypto) return;
        transactionModal.close();
        editTransaction(crypto, transaction);
      };
    }
    manageTransactionsTableBody?.appendChild(tr);
  }
}

function editTransaction(crypto: Cryptocurrency, transaction: Transaction) {
  const editTransactionModal = document.getElementById(
    "edit-transaction-modal"
  ) as HTMLDialogElement;
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
    const currentCrypto = store.getAssetById(crypto.id);
    const selectedTransactionType = buyTransactionBtn.classList.contains(
      "active"
    )
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
    editTransactionModal.close();
    saveData();
    init();
  };
}
