import { saveData } from "../data/localstorage";
import * as store from "../data/store";
import { refreshUI } from "../main";

export function openCryptocurrencyModal(assetId: string) {
  const cryptocurrencyModal = document.getElementById(
    "cryptocurrency-modal"
  ) as HTMLDialogElement;
  const cryptocurrencyModalCloseBtn = document.getElementById(
    "cryptocurrency-modal-close"
  );
  const cryptocurrencyForm = document.getElementById(
    "cryptocurrencyForm"
  ) as HTMLFormElement;
  const errorDiv = document.getElementById(
    "cryptocurrencyModalError"
  ) as HTMLDivElement;

  if (
    !cryptocurrencyModal ||
    !cryptocurrencyModalCloseBtn ||
    !cryptocurrencyForm
  ) {
    console.error("Cryptocurrency modal or its elements not found.");
    return;
  }

  // Clear any previous error messages
  errorDiv.style.display = "none";
  errorDiv.textContent = "";

  cryptocurrencyModal.showModal();

  // Populate the form with the asset data
  const asset = store.getAssetById(assetId);
  if (asset) {
    (document.getElementById("cryptocurrencyId") as HTMLInputElement).value =
      asset.id;
    (
      document.getElementById("cryptocurrencySymbol") as HTMLInputElement
    ).value = asset.symbol;
    (document.getElementById("cryptocurrencyName") as HTMLInputElement).value =
      asset.name;
  }

  // Handle form submission
  const handleSubmit = (e: Event) => {
    e.preventDefault();

    const coingeckoId = (
      document.getElementById("cryptocurrencyId") as HTMLInputElement
    ).value.trim();
    const symbol = (
      document.getElementById("cryptocurrencySymbol") as HTMLInputElement
    ).value.trim();
    const name = (
      document.getElementById("cryptocurrencyName") as HTMLInputElement
    ).value.trim();

    // Basic validation
    if (!coingeckoId || !symbol || !name) {
      errorDiv.textContent = "Please fill in all fields";
      errorDiv.style.display = "block";
      return;
    }

    try {
      // Update the asset in the store
      store.updateAsset(assetId, {
        id: coingeckoId,
        symbol: symbol.toUpperCase(),
        name: name,
      });

      // Close modal and reset form
      cryptocurrencyModal.close();
      cryptocurrencyForm.reset();

      saveData();
      refreshUI();
    } catch (error) {
      errorDiv.textContent = "Failed to save asset. Please try again.";
      errorDiv.style.display = "block";
      console.error("Error updating asset:", error);
    }
  };

  const handleClose = () => {
    cryptocurrencyModal.close();
    cryptocurrencyForm.reset();
    errorDiv.style.display = "none";
    errorDiv.textContent = "";
  };

  // Remove previous event listeners to avoid duplicates
  cryptocurrencyForm.removeEventListener("submit", handleSubmit);
  cryptocurrencyModalCloseBtn.removeEventListener("click", handleClose);
  cryptocurrencyForm.addEventListener("submit", handleSubmit);
  cryptocurrencyModalCloseBtn.addEventListener("click", handleClose);

  // Close modal when clicking outside
  cryptocurrencyModal.addEventListener("click", (e) => {
    if (e.target === cryptocurrencyModal) {
      handleClose();
    }
  });
}
