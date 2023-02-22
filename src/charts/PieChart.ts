import { cryptocurrencies } from "../main";
import { Chart } from "chart.js/auto";
import { getCoinsPrices } from "../data/Coingecko";

let canvas1 = <HTMLCanvasElement>document.getElementById("pieChart1");
let pieChart1: Chart<"pie", number[], string>;
let canvas2 = <HTMLCanvasElement>document.getElementById("pieChart2");
let pieChart2: Chart<"pie", number[], string>;
let labels1: string[] = [];
let data1: number[] = [];

let labels2: string[] = [];
let data2: number[] = [];

let colors: string[] = [];

/* 

    First pie chart that displays the initial values 

*/
export function preparePieChart1() {
  // Reset the existing chart
  if (pieChart1 != null) pieChart1.destroy();
  labels1 = [];
  data1 = [];
  colors = [];

  cryptocurrencies.forEach((crypto) => {
    labels1.push(crypto.symbol);
    data1.push(crypto.totalCost);
    colors.push(crypto.color); //colors array is used to have consistent colors over all the charts
  });

  pieChart1 = new Chart(canvas1, {
    type: "pie",
    data: {
      datasets: [
        {
          data: data1,
          backgroundColor: colors,
        },
      ],
      labels: labels1,
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";

              label += " ";
              if (context.parsed !== null) {
                label += new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(context.parsed);
              }
              return label;
            },
            footer: function (context) {
              if (context[0] !== null) {
                let totalSum = context[0].dataset.data.reduce((sum, current) => sum + current, 0);
                let percentageValue = (context[0].parsed / totalSum) * 100;

                // Percentages smaller than 1 will display 2 decimals, smaller than 10 will display 1 decimal, others will display 0 decimals
                if (percentageValue < 1) return `${percentageValue.toFixed(2)}%`;
                if (percentageValue < 10) return `${percentageValue.toFixed(1)}%`;

                return `${percentageValue.toFixed(0)}%`;
              }
              return "";
            },
          },
        },
      },
    },
  });
}

/* 

    Second pie chart that displays the current values 

*/
let coinPrices: string[] = [];
export async function preparePieChart2() {
  // Reset the existing chart
  if (pieChart2 != null) pieChart2.destroy();
  labels2 = [];
  data2 = [];
  colors = [];

  coinPrices = await getCoinsPrices(cryptocurrencies.map((c) => c.id));
  cryptocurrencies.forEach((crypto) => {
    labels2.push(crypto.symbol);
    data2.push(parseFloat(coinPrices[crypto.id].usd) * crypto.totalAmount);
    colors.push(crypto.color);
  });

  pieChart2 = new Chart(canvas2, {
    type: "pie",
    data: {
      datasets: [
        {
          data: data2,
          backgroundColor: colors,
        },
      ],
      labels: labels2,
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";

              label += " ";
              if (context.parsed !== null) {
                label += new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(context.parsed);
              }
              return label;
            },
            footer: function (context) {
              if (context[0] !== null) {
                let totalSum = context[0].dataset.data.reduce((sum, current) => sum + current, 0);
                let percentageValue = (context[0].parsed / totalSum) * 100;
                
                // Percentages smaller than 1 will display 2 decimals, smaller than 10 will display 1 decimal, others will display 0 decimals
                if (percentageValue < 1) return `${percentageValue.toFixed(2)}%`;
                if (percentageValue < 10) return `${percentageValue.toFixed(1)}%`;

                return `${percentageValue.toFixed(0)}%`;
              }
              return "";
            },
          },
        },
      },
    },
  });
}
