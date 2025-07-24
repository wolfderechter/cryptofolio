import { getCoins } from "../data/coingecko";
import { startTransaction } from "../main";

export function initSearchModal() {
  const searchModal = document.getElementById(
    "search-modal"
  ) as HTMLDialogElement;
  const addCryptoBtn = document.querySelector(
    "#addCrypto"
  ) as HTMLButtonElement;
  const searchModalCloseBtn = document.getElementById("search-modal-close");
  const searchForm = document.querySelector("#searchForm") as HTMLFormElement;
  const cryptoListDiv = document.getElementById("cryptoList");
  const searchInput = document.getElementById(
    "crypto-search-input"
  ) as HTMLInputElement;

  if (
    !searchModal ||
    !addCryptoBtn ||
    !searchModalCloseBtn ||
    !searchForm ||
    !cryptoListDiv
  ) {
    console.error("Search modal or its elements not found.");
    return;
  }

  addCryptoBtn?.addEventListener("click", () => {
    cryptoListDiv.replaceChildren();
    searchForm.reset();
    searchModal.showModal();
  });
  searchModalCloseBtn?.addEventListener("click", () => {
    searchModal.close();
    searchForm.reset();
  });
  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    const results = await getCoins(query);
    renderResults(results, cryptoListDiv, searchModal);
  });
  searchModal.addEventListener("cancel", () => {
    searchForm.reset();
  });
}

function renderResults(results: any[], cryptoListDiv: HTMLElement, searchModal: HTMLDialogElement) {
  cryptoListDiv.replaceChildren();

  if (results.length === 0) {
    cryptoListDiv.textContent = "No results found.";
  }

  for (const coin of results) {
    const coinDiv = document.createElement("div");

    const thumbnail = document.createElement("img");
    thumbnail.src = coin.large;

    const name = document.createElement("p");
    name.textContent = coin.name;

    coinDiv.append(thumbnail, name);

    // When selecting a certain coin, clear the popup and continue with the coin selected
    coinDiv.addEventListener("click", () => {
      searchModal.close();
      startTransaction({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
      });
    });
    cryptoListDiv.appendChild(coinDiv);
  }
}
