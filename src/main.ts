import { loadDataFromJson } from "./data/localstorage";
import { getCoinsPrices } from "./data/coingecko";
import { renderCharts } from "./charts/init";
import { CountUp } from "countup.js";
import { humanReadableNumber } from "./helpers";
import { initSearchModal } from "./ui/searchModal";
import {
  initTransactionModal,
  manageTransactions,
  startTransaction,
} from "./ui/transactionModal";
import * as store from "./data/store";
import { initImportExportButtons } from "./ui/importExport";
import { openCryptocurrencyModal } from './ui/cryptocurrencyModal';

// Summary
const summaryTotalValue = document.getElementById("summaryTotalValue");
const summaryTotalValueContent = document.getElementById(
  "summaryTotalValueContent"
)!;
const summaryTotalPercentage = document.getElementById(
  "summaryTotalPercentage"
)!;

// Summary number animations
const summaryTotalValueContentCountUp = new CountUp(
  summaryTotalValueContent,
  0,
  {
    decimalPlaces: 2,
    duration: 1,
  }
);

async function populateAssetsTableAndSummary() {
  const tableBody = document.getElementById("assetsTableBody")!;

  if (store.getAssetsSize() === 0) {
    summaryTotalValueContent.textContent = ``;
    summaryTotalPercentage.textContent = `%`;
    tableBody.replaceChildren();
    return;
  }

  const coinPrices = await getCoinsPrices(store.getAssets().map((c) => c.id));
  // When we overload the coingecko api, we get a 429 and empty objects back
  // In this case we stop what we are doing and tell the user to slow down
  if (coinPrices.length === 0) {
    return;
  }
  tableBody.replaceChildren();

  let cryptoValueSum = 0;
  let cryptoBuyCostSum = 0;
  let cryptoSellCostSum = 0;

  const sortedCryptocurrencies = store.getAssets().sort((a, b) => {
    const cryptoValueA = parseFloat(coinPrices[a.id].usd) * a.totalAmount;
    const cryptoValueB = parseFloat(coinPrices[b.id].usd) * b.totalAmount;
    return cryptoValueB - cryptoValueA; // Sort by value descending
  });

  sortedCryptocurrencies.forEach((asset) => {
    const cryptoValue =
      parseFloat(coinPrices[asset.id].usd) * asset.totalAmount;
    const gain = cryptoValue + asset.totalSellCost - asset.totalBuyCost;
    const gainInPercentage = (gain / asset.totalBuyCost) * 100;

    cryptoValueSum += cryptoValue;
    cryptoBuyCostSum += asset.totalBuyCost;
    cryptoSellCostSum += asset.totalSellCost;

    const tr = document.createElement("tr");

    // When we have no current holdings, skip coin
    if (asset.totalAmount === 0) return;

    tr.innerHTML = `
      <td class="openCryptocurrencyModal" style="cursor:pointer">${asset.name}</td>
      <td>$${asset.averageBuyPrice.toFixed(2)}</td>
      <td title="${asset.totalAmount}">${humanReadableNumber(
      asset.totalAmount
      )} ${asset.symbol}</td>
      <td>$${humanReadableNumber(asset.totalCost)}</td>
      <td>$${humanReadableNumber(cryptoValue)}</td>
      <td>${gainInPercentage.toFixed(2)}%</td>
      <td class="assetsTableBtns">
      <button id="assetsTableAdd" class="fa fa-plus-minus iconBtn"></button>
      <button title="Edit transactions" id="assetsTableManage" class="fa-solid fa-pen-to-square iconBtn"></button>
      </td>
      `;

    // Make the asset name cell clickable to open the asset edit popup
    const assets = tr.querySelectorAll<HTMLTableCellElement>(".openCryptocurrencyModal");
    assets.forEach((assetCell) => {
      assetCell.onclick = () => {
        openCryptocurrencyModal(asset.id);
      };
    });

    const addButton = tr.querySelector<HTMLButtonElement>("#assetsTableAdd");
    if (addButton) {
      addButton.onclick = () =>
        startTransaction({
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
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
  loadDataFromJson(); // Load initial data from localStorage

  populateAssetsTableAndSummary();
  renderCharts();
  initSearchModal();
  initTransactionModal();
  initImportExportButtons();

  // Setup clicking outside dialogs to close for all dialogs
  const allDialogs = document.querySelectorAll<HTMLDialogElement>("dialog");
  // Attach a click listener to each one
  allDialogs.forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  });
}

init();
