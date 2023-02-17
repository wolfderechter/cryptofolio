import { cryptocurrencies } from "../main";
import { Chart } from "chart.js/auto";
import { getCoinChart } from "../data/Coingecko";
import "chartjs-adapter-date-fns";
// import { enUS } from "date-fns/locale";

let canvas1 = <HTMLCanvasElement>document.getElementById("lineChart1");
let lineChart1;
let data1: { x: Date; y: number }[] = Array(100).fill({ x: null, y: 0 });
let allData: Map<string, any[]> = new Map();
let coinChart: string[] = [];
let dates: Date[] = [];

/* 
    The portfolio line chart consist of the value of the portfolio during the last x amount of days

    Each day it should show the portfolio value at that time by combining all the amount of crypto held * price of that crypto during that day
*/
export async function prepareLineChart1() {
  let datesOnce = true;
  for (const crypto of cryptocurrencies) {
    /*
      By default prepare the chart for the last 100 days
        Returns an array of:
        [
        1675728000000 //Unix timestamp)
        22786.483006387727 //price during that day
        ]
    */
    let prices: number[];
    coinChart = await getCoinChart(crypto.id, 100);

    // Use the dates of the first crypto fetched for all the other cryptos, Do this only once
    if (datesOnce) {
      dates = coinChart.map((data) => {
        return new Date(data[0]);
      });
      datesOnce = false;
    }

    prices = coinChart.map((data) => parseFloat(data[1]));

    for (let index = 0; index < coinChart.length; index++) {
      // calculate how much of a coin I have on a certain date
      let coinAmount = crypto.calculateCoinAmountOnDate(dates[index]);
      let coinTotal = coinAmount * prices[index];

      data1[index] = { x: dates[index], y: data1[index]?.y + coinTotal };
      // save per coin the total each day in the allData array
      if (!allData.has(crypto.id)) allData.set(crypto.id, []);
      allData.get(crypto.id)?.push(coinTotal);
    }
  }

  lineChart1 = new Chart(canvas1, {
    type: "line",
    data: {
      datasets: [
        {
          data: data1,
          label: "Total Value",
        },
      ],
    },
    options: {
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            // Include a dollar sign in the ticks
            callback: function (value) {
              return "$ " + value;
            },
          },
        },
      },
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";

              if (label) {
                label += ": ";
              }
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(context.parsed.y);
              }
              return label;
            },
          },
        },
      },
    },
  });

  for (let [key, value] of allData) {
    // Generate a random color
    let color =
      "#" + (((1 << 24) * Math.random()) | 0).toString(16).padStart(6, "0");
    console.log(color);
    let index = 0;
    const newDataSet = {
      data: value.map((d) => {
        return { x: dates[index++], y: d };
      }),
      label: key,
      backgroundColor: color,
      borderColor: color,
      hidden: true, //disable by default to keep it clean
    };

    lineChart1.data.datasets.push(newDataSet);
    lineChart1.update();
  }
}
