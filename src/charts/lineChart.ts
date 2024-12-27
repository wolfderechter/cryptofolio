import { cryptocurrencies, SLEEP_TIME } from "../main";
import { Chart } from "chart.js/auto";
import { getCoinChart } from "../data/coingecko";
import "chartjs-adapter-date-fns";
import { isCacheValid } from '../data/cache';

let dateModeDays = 31;
let dateModeArrayLength = 32; // The array length is the number of days + 1 except for 1D => 24 hours
let dateModeInterval = "daily";

let canvas1 = <HTMLCanvasElement>document.getElementById("lineChart1")!;
let canvas1Parent = <HTMLCanvasElement>document.getElementById("lineChart1Parent")!;
let rateLimiting = <HTMLDivElement>document.getElementById("rateLimiting")!;
let toggleDate = <HTMLDivElement>document.getElementById("toggleDate")!;
let loader = <HTMLDivElement>document.getElementById("loader")!;
let lineChart1: Chart<"line", { x: Date; y: number }[], unknown>;
let data1: { x: Date; y: number }[] = Array(dateModeArrayLength).fill({ x: null, y: 0 });
let allData: Map<string, any[]> = new Map();
let coinChart: string[] = [];
let dates: Date[] = [];
let netInvested: number[] = [];
export let datasetColors: { id: string; color: string }[] = [];

/*
    The portfolio line chart consist of the value of the portfolio during the last x amount of days

    Each day it should show the portfolio value at that time by combining all the amount of crypto held * price of that crypto during that day
*/
export async function prepareLineChart1() {
  // In case no cryptocurrencies are present (anymore) we destroy the chart, hide the toggle dates and the canvas so it doesn't get shown if it's still calculating
  if (cryptocurrencies.length === 0) {
    loader.classList.add("disabled");
    rateLimiting.classList.add("disabled");
    toggleDate.style.display = "none";
    return;
  }

  canvas1Parent.style.display = "none";
  toggleDate.style.display = "block";
  data1 = [];
  data1 = Array(dateModeArrayLength).fill({ x: null, y: 0 });
  netInvested = [];
  allData.clear();

  let once = true;
  let limited = false;
  let cryptoIndex = 0;
  loader.classList.remove("disabled");
  rateLimiting.classList.add("disabled");

  for (const crypto of cryptocurrencies) {
    /*
      By default prepare the chart for the last 31 days
        Returns an array of:
        [
        1675728000000 //Unix timestamp)
        22786.483006387727 //price during that day
        ]
    */
    let prices: number[];
    coinChart = await getCoinChart(crypto.id, dateModeDays, dateModeInterval);
    cryptoIndex++;

    if (coinChart.length === 0) {
      limited = true;
      break;
    }

    // Things we only need to do once
    // - Use the dates of the first crypto fetched for all the other cryptos, Do this only once
    if (once) {
      dates = coinChart.map((data) => {
        return new Date(data[0]);
      });
      once = false;
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
      // If a netInvested already exists on date index, add the cost to the value
      if (netInvested[index] != null && netInvested[index] != undefined) {
        netInvested[index] += cost;
      } else {
        // else push the cost to the netInvested array
        netInvested.push(cost);
      }
    }

    // If data is cached continue, if not sleep for a bit to prevent rate limiting
    const cacheKey = `getCoinChart_${crypto.id}_${dateModeDays}_${dateModeInterval}`;

    if (!isCacheValid(cacheKey)) {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      await sleep(cryptoIndex * SLEEP_TIME + 750);
    }
  }
  // If we are being rate limited, stop what we are doing since the data is incomplete
  if (limited) {
    rateLimiting.classList.remove("disabled");
    return;
  }

  // Reset the chart
  if (lineChart1 != null) {
    lineChart1.destroy();
  }

  loader.classList.add("disabled");
  if (cryptocurrencies.length > 0) canvas1Parent.style.display = "block";

  lineChart1 = new Chart(canvas1, {
    type: "line",
    data: {
      datasets: [
        {
          data: data1,
          label: "Total value",
          pointRadius: 0,
          fill: true,
          order: 2,
          backgroundColor: totalValueGradient,
          borderColor: colors.purple.default,
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        x: {
          type: "time",
          time: {
            unit: dateModeInterval === "hourly" ? "hour" : "day",
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
    plugins: [
      {
        id: "verticalLineOnHover",
        afterDraw: (chart) => {
          // Draw vertical line
          const activeEle = chart.getActiveElements();

          // If we are hovering the tooltip will be an active element
          if (activeEle.length <= 0) return;

          let x = activeEle[0].element.x;
          let yAxis = chart.scales.y;
          let ctx = chart.ctx;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x, yAxis.top);
          ctx.lineTo(x, yAxis.bottom);
          ctx.lineWidth = 0.5;
          ctx.strokeStyle = colors.purple.threequarters;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.restore();
        },
      },
    ],
  });

  for (let [key, value] of allData) {
    let color = cryptocurrencies.find((c) => c.id === key)?.color;
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
      order: 0,
      borderWidth: 1,
    };

    lineChart1.data.datasets.push(newDataSet);
  }

  // Add the netinvested dataset to the linechart
  let index = 0;
  let netInvestedColor = "#c3f73a";
  const netInvestDataSet = {
    data: netInvested.map((net) => {
      return { x: dates[index++], y: net };
    }),
    label: "Net invested",
    backgroundColor: netInvestedColor,
    borderColor: netInvestedColor,
    hidden: true, //disable by default to keep it clean
    pointRadius: 0,
    order: 1,
    borderWidth: 1,
  };

  lineChart1.data.datasets.push(netInvestDataSet);
  lineChart1.update();
}

/*

Colors

*/
const colors = {
  purple: {
    default: "rgba(149, 76, 233, 1)",
    threequarters: "rgba(149, 76, 233, 0.75)",
    half: "rgba(149, 76, 233, 0.5)",
    quarter: "rgba(149, 76, 233, 0.25)",
    zero: "rgba(149, 76, 233, 0.05)",
  },
};

const totalValueGradient = canvas1.getContext("2d")?.createLinearGradient(0, 25, 0, 300)!;
totalValueGradient.addColorStop(0, colors.purple.half);
totalValueGradient.addColorStop(0.5, colors.purple.quarter);
totalValueGradient.addColorStop(0, colors.purple.quarter);
totalValueGradient.addColorStop(1, colors.purple.zero);

/*

  Change Date Mode

*/
const toggleDayMode = document.getElementById("toggleDayMode")!;
const toggleWeekMode = document.getElementById("toggleWeekMode")!;
const toggleMonthMode = document.getElementById("toggleMonthMode")!;
const toggleYearMode = document.getElementById("toggleYearMode")!;
const toggleAllMode = document.getElementById("toggleAllMode")!;

toggleDayMode.addEventListener("click", switchDateMode);
toggleWeekMode.addEventListener("click", switchDateMode);
toggleMonthMode.addEventListener("click", switchDateMode);
toggleYearMode.addEventListener("click", switchDateMode);
toggleAllMode.addEventListener("click", switchDateMode);

function switchDateMode(e: any) {
  if (cryptocurrencies.length === 0) {
    return;
  }

  let target = e.target as HTMLButtonElement;

  // Remove other active classes
  toggleDayMode.classList.remove("active");
  toggleWeekMode.classList.remove("active");
  toggleMonthMode.classList.remove("active");
  toggleYearMode.classList.remove("active");
  toggleAllMode.classList.remove("active");

  // Add the current active classes
  target.classList.add("active");
  // dateModeDays = Number(target.value);
  switch (target.value) {
    case "day":
      dateModeDays = 1;
      dateModeArrayLength = 25;
      dateModeInterval = "hourly";
      break;
    case "week":
      dateModeDays = 7;
      dateModeArrayLength = dateModeDays + 1;
      dateModeInterval = "daily";
      break;
    case "month":
      dateModeDays = 31;
      dateModeArrayLength = dateModeDays + 1;
      dateModeInterval = "daily";
      break;
    case "year":
      dateModeDays = 365;
      dateModeArrayLength = dateModeDays + 1;
      dateModeInterval = "daily";
      break;
    case "all":
      // Return the max amount of days => get the earliest transaction date
      let earliestDate = cryptocurrencies
        .map((c) => c.transactionDates)
        .reduce(function (a, b) {
          return a > b ? a : b;
        })[0];
      let currentDate = new Date();
      const diffTime = Math.abs(currentDate.getTime() - earliestDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      dateModeDays = diffDays;
      dateModeArrayLength = dateModeDays + 1;
      dateModeInterval = "daily";
      break;
    default:
      dateModeDays = 31;
      dateModeArrayLength = dateModeDays + 1;
      dateModeInterval = "daily";
      break;
  }

  prepareLineChart1();
}
