class CryptoCurrency {
  private transactions: Transaction[];
  // defining private/public inits the values, so no need to manually do this.id = id
  constructor(public id: string, public symbol: string, public name: string) {
    this.transactions = new Array<Transaction>();
  }

  addTransaction(transaction: Transaction) {
    this.transactions.push(transaction);
  }

  // use uuid here?
  removeTransaction(transaction: Transaction) {
    this.transactions.splice(this.transactions.indexOf(transaction), 1);
  }

  get totalAmount(): number {
    return this.transactions.reduce((sum, current) => sum + current.amount, 0);
  }

  get totalCost(): number {
    return this.transactions.reduce((sum, current) => sum + current.cost, 0);
  }

  get averageBuyPrice(): number {
    return this.totalCost / this.totalAmount;
  }
}

class Transaction {
  constructor(private date: Date, public amount: number, public cost: number) {}

  get averageBuyPrice(): number {
    return this.cost / this.amount;
  }
}

const cryptocurrencies = new Array<CryptoCurrency>();
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
  getData(input.value).then((data) => {
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
        startTransaction(data[c]);
      };
      cryptoListDiv.appendChild(coinDiv);
    }
  });
}

async function getData(input: string) {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${input}`
    );
    const jsonResult = await res.json();

    return jsonResult["coins"];
  } catch (error) {
    console.log(error);
  }
}

function startTransaction(coin: any) {
  // Switch the modal popup to the transaction popup
  transactionModal.style.display = "block";
  closeSearchModal();

  const addTransactionBtn = document.getElementById("addTransactionBtn");
  const transactionTitle = document.getElementById("transactionModalTitle")!;
  transactionTitle.textContent = `New transaction for ${coin.name}`;

  addTransactionBtn?.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      // Create the cryptocurrency object
      // Add the transaction
      let resultCrypto = cryptocurrencies.find((c) => c.id === coin.id);

      // If crypto was already present, add new transaction
      if (resultCrypto) {
        console.log("am i here");
        resultCrypto.addTransaction(
          new Transaction(
            new Date(
              (<HTMLInputElement>(
                document.getElementById("transactionDate")
              )).value
            ),
            Number(
              (<HTMLInputElement>document.getElementById("transactionAmount"))
                .value
            ),
            Number(
              (<HTMLInputElement>document.getElementById("transactionCost"))
                .value
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
              (<HTMLInputElement>(
                document.getElementById("transactionDate")
              )).value
            ),
            Number(
              (<HTMLInputElement>document.getElementById("transactionAmount"))
                .value
            ),
            Number(
              (<HTMLInputElement>document.getElementById("transactionCost"))
                .value
            )
          )
        );
      }

      // Close the transaction modal when done
      closeTransactionModal();
      populateAssetsTable();
    },
    { once: true }
  );
}

function populateAssetsTable() {
  const tableBody = document.getElementById("assetsTableBody")!;
  tableBody.innerHTML = "";

  cryptocurrencies.forEach((asset) => {
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${asset.symbol}</td>
      <td>${asset.averageBuyPrice.toFixed(2)}</td>
      <td>${asset.totalAmount}</td>
      <td>${asset.totalCost}</td>
    `;
    tableBody?.appendChild(tr);
  });
}
populateAssetsTable();
