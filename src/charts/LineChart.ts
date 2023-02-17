import { cryptocurrencies } from "../main";
import { Chart } from "chart.js/auto";
import { getCoinChart } from "../data/Coingecko";
import "chartjs-adapter-date-fns";
// import { enUS } from "date-fns/locale";

let canvas1 = <HTMLCanvasElement>document.getElementById("lineChart1");
let lineChart1: Chart<"line", { x: Date; y: number }[], unknown>;
let data1: { x: Date; y: number }[] = Array(100).fill({ x: null, y: 0 });
let allData: Map<string, any[]> = new Map();
let coinChart: string[] = [];
let dates: Date[] = [];
/* 
    The portfolio line chart consist of the value of the portfolio during the last x amount of days

    Each day it should show the portfolio value at that time by combining all the amount of crypto held * price of that crypto during that day
*/
export async function prepareLineChart1() {
  // Reset the chart
  lineChart1?.destroy();
  data1 = [];
  data1 = Array(100).fill({ x: null, y: 0 });

  let datesOnce = true;
  allData.set("Net invested", []);
  console.log(cryptocurrencies);
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
      let amount = crypto.calculateAmountOnDate(dates[index]);
      let coinTotal = amount * prices[index];

      data1[index] = { x: dates[index], y: data1[index]?.y + coinTotal };
      // save per coin the total each day in the allData array
      if (!allData.has(crypto.id)) allData.set(crypto.id, []);
      allData.get(crypto.id)?.push(coinTotal);

      /* 
        1. calculate the total cost per coin by a certain date
        2. if a cost is already present for that day, add it up. 
           Else push a new cost
      */
      let cost = crypto.calculateCostOnDate(dates[index]);
      let totalCost = allData.get("Net invested");
      if (totalCost && totalCost[index]) {
        totalCost[index] += cost;
        allData.set("Net invested", totalCost);
        console.log("totalCost[index], cost", totalCost[index], cost);
      } else {
        allData.get("Net invested")?.push(cost);
      }
    }
  }

  lineChart1 = new Chart(canvas1, {
    type: "line",
    data: {
      datasets: [
        {
          data: data1,
          label: "Total Value",
          pointRadius: 0,
          fill: true,
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
      interaction: {
        axis: "x",
        mode: "nearest",
        intersect: false,
      },
    },
    //   customCanvasBackgroundColor: {
    //     color: "#202224",
    //   },
    // },
    // plugins: [plugin],
  });

  for (let [key, value] of allData) {
    // Generate a random color
    let color =
      "#" + (((1 << 24) * Math.random()) | 0).toString(16).padStart(6, "0");

    let index = 0;
    const newDataSet = {
      data: value.map((d) => {
        return { x: dates[index++], y: d };
      }),
      label: key,
      backgroundColor: color,
      borderColor: color,
      hidden: true, //disable by default to keep it clean
      pointRadius: 0,
    };

    lineChart1.data.datasets.push(newDataSet);
    lineChart1.update();
  }
}

// Note: changes to the plugin code is not reflected to the chart, because the plugin is loaded at chart construction time and editor changes only trigger an chart.update().
// const plugin = {
//   id: "customCanvasBackgroundColor",
//   beforeDraw: (
//     chart: { width?: any; height?: any; ctx?: any },
//     args: any,
//     options: { color: string }
//   ) => {
//     const { ctx } = chart;
//     ctx.save();
//     ctx.globalCompositeOperation = "destination-over";
//     ctx.fillStyle = options.color || "#99ffff";
//     ctx.fillRect(0, 0, chart.width, chart.height);
//     ctx.restore();
//   },
// };
