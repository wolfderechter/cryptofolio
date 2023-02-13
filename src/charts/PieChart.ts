import { cryptocurrencies } from "../main";
import { Chart } from "chart.js/auto";
import { getCoinPrices } from "../data/Coingecko";

let canvas1 = <HTMLCanvasElement>document.getElementById("pieChart1");
let pieChart1: Chart<"pie", number[], string>;
let canvas2 = <HTMLCanvasElement>document.getElementById("pieChart2");
let pieChart2: Chart<"pie", number[], string>;
let labels1: string[] = [];
let data1: number[] = [];

let labels2: string[] = [];
let data2: number[] = [];

/* 

    First pie chart that displays the initial values 

*/
function preparePieChart1() {
  // Reset the existing chart
  pieChart1?.destroy();
  labels1 = [];
  data1 = [];

  cryptocurrencies.forEach((crypto) => {
    labels1.push(crypto.symbol);
    data1.push(crypto.totalCost);
  });

  pieChart1 = new Chart(canvas1, {
    type: "pie",
    data: {
      datasets: [
        {
          data: data1,
        },
      ],
      labels: labels1,
    },
    options: {
      responsive: true,
    },
  });
}
// preparePieChart1();

/* 

    Second pie chart that displays the current values 

*/
let coinPrices: string[] = [];
async function preparePieChart2() {
  // Reset the existing chart
  pieChart2?.destroy();
  labels2 = [];
  data2 = [];

  coinPrices = await getCoinPrices(cryptocurrencies.map((c) => c.id));
  cryptocurrencies.forEach((crypto) => {
    labels2.push(crypto.symbol);
    data2.push(parseFloat(coinPrices[crypto.id].usd) * crypto.totalAmount);
  });

  pieChart2 = new Chart(canvas2, {
    type: "pie",
    data: {
      datasets: [
        {
          data: data2,
        },
      ],
      labels: labels2,
    },
    options: {
      responsive: true,
    },
  });
}
// preparePieChart2();

export function renderCharts() {
  preparePieChart1();
  preparePieChart2();
}
