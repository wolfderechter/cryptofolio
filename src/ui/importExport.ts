import * as localStorage from "../data/localstorage";
import * as store from "../data/store";
import { getFileContent } from "../helpers";

export function initImportExportButtons() {
  const importDropdownBtn = document.getElementById("importDropdownBtn");
  const importDropdown = document.getElementById("importDropdown");
  const exportDropdownBtn = document.getElementById("exportDropdownBtn");
  const exportDropdown = document.getElementById("exportDropdown");
  const exportDataJsonBtn = document.getElementById("exportDataJsonBtn");
  const exportDataCsvBtn = document.getElementById("exportDataCsvBtn");

  const importDataJsonBtn = document.getElementById("importDataJsonBtn");
  const importDataCsvBtn = document.getElementById("importDataCsvBtn");
  const csvInstructionsModal = <HTMLDialogElement>(
    document.getElementById("csvInstructionsModal")!
  );
  const csvModalCloseBtn = document.getElementById("csv-warning-close");
  const downloadSampleCsv = document.getElementById("downloadSampleCsv");

  if (
    !importDropdownBtn ||
    !exportDropdownBtn ||
    !importDropdown ||
    !exportDropdown ||
    !exportDataJsonBtn ||
    !exportDataCsvBtn ||
    !importDataJsonBtn ||
    !importDataCsvBtn ||
    !csvModalCloseBtn ||
    !csvInstructionsModal ||
    !downloadSampleCsv
  ) {
    console.error("One or more import buttons or modal elements are missing.");
    return;
  }

  // Setup dropdowns
  importDropdownBtn.addEventListener("click", () => {
    importDropdown.classList.toggle("active");
    // Close the other dropdown if open
    if (exportDropdown.classList.contains("active"))
      exportDropdown.classList.remove("active");
  });
  exportDropdownBtn.addEventListener("click", () => {
    exportDropdown.classList.toggle("active");
    // Close the other dropdown if open
    if (importDropdown.classList.contains("active"))
      importDropdown.classList.remove("active");
  });

  // Setup export
  exportDataJsonBtn.addEventListener("click", () => {
    const data = JSON.stringify(store.getAssets(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    exportDataJsonBtn.setAttribute("href", url);
    exportDataJsonBtn.setAttribute("download", "cryptofolioData.json");
  });
  exportDataCsvBtn.addEventListener("click", () => {
    const csv = localStorage.convertToCsv(store.getAssets());
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    exportDataCsvBtn.setAttribute("href", url);
    exportDataCsvBtn.setAttribute("download", "cryptofolioData.csv");
  });

  // Setup import
  importDataJsonBtn.addEventListener("change", async (event: Event) => {
    const jsonContent = await getFileContent(event);
    localStorage.loadDataFromJson(jsonContent);
  });
  importDataCsvBtn.addEventListener("change", async (event: Event) => {
    const csvContent = await getFileContent(event);
    const parsedData = localStorage.parseCsv(csvContent);
    localStorage.loadDataFromCsv(parsedData);
  });
  downloadSampleCsv.addEventListener("click", () => {
    const csvContent =
      "Data,Way,Base amount,Quote amount,Quote currency,Coingecko id,Symbol\n2023-10-01,BUY,0.5,25000,USD,bitcoin,BTC";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    downloadSampleCsv.setAttribute("href", url);
  });
  csvModalCloseBtn.addEventListener("click", () =>
    csvInstructionsModal.close()
  );
  importDataCsvBtn.addEventListener("click", () => {
    if (csvInstructionsModal) csvInstructionsModal.showModal();
  });

  // Close dropdowns when clicking outside
  window.addEventListener("click", (event) => {
    // Cast the event target to an HTML Element
    const target = event.target as HTMLElement;
    // The .closest() method checks if the clicked element or any of its parents
    // has the class 'dropdown'. If not, it means the click was outside.
    if (!target.closest(".dropdown")) {
      importDropdown.classList.remove("active");
      exportDropdown.classList.remove("active");
    }
  });
}
