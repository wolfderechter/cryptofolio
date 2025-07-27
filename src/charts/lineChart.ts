import { sleep, SLEEP_TIME } from "../helpers";
import { Chart } from "chart.js/auto";
import { getCoinChart } from "../data/coingecko";
import "chartjs-adapter-date-fns";
import { isCacheValid } from "../data/cache";
import * as store from '../data/store';

let dateModeDays = 30;
const colors = {
  purple: {
    default: "rgba(149, 76, 233, 1)",
    threequarters: "rgba(149, 76, 233, 0.75)",
    half: "rgba(149, 76, 233, 0.5)",
    quarter: "rgba(149, 76, 233, 0.25)",
    zero: "rgba(149, 76, 233, 0.05)",
  },
};

// DOM Elements
const canvas1 = document.getElementById("lineChart1") as HTMLCanvasElement;
const canvas1Parent = document.getElementById(
  "lineChart1Parent"
) as HTMLElement;
const rateLimiting = document.getElementById("rateLimiting") as HTMLDivElement;
const toggleDate = document.getElementById("toggleDate") as HTMLDivElement;
const loader = document.getElementById("loader") as HTMLDivElement;

// Chart and Data
let lineChart1: Chart<"line", { x: Date; y: number }[], unknown>;
let data1: { x: Date; y: number }[] = [];
const allData: Map<string, any[]> = new Map();
let dates: Date[] = [];
let netInvested: number[] = [];

// Initialize Gradient
const totalValueGradient = canvas1
  ?.getContext("2d")
  ?.createLinearGradient(0, 25, 0, 300);
totalValueGradient?.addColorStop(0, colors.purple.half);
totalValueGradient?.addColorStop(0.5, colors.purple.quarter);
totalValueGradient?.addColorStop(1, colors.purple.zero);

const generateFullDatesArray = (days: number): Date[] => {
  const dates: Date[] = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (days - 1));

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

const normalizeCoinChart = (
  coinChart: [string, number][],
  dates: Date[]
): [string, number][] => {
  const normalizedChart: [string, number][] = [];
  const coinDataMap = new Map<string, number>();

  // Create a map of date to price for the coin
  for (const data of coinChart) {
    const date = new Date(data[0]).toISOString().split("T")[0]; // Use YYYY-MM-DD as the key
    coinDataMap.set(date, data[1]);
  }

  // Fill in missing dates with [date, 0]
  for (const date of dates) {
    const dateKey = date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    const price = coinDataMap.get(dateKey) || 0;
    normalizedChart.push([dateKey, price]); // Use the formatted date string
  }

  return normalizedChart;
};

const updateChartData = (crypto: any, prices: number[]) => {
  for (let index = 0; index < dates.length; index++) {
    const amount = crypto.calculateAmountOnDate(dates[index]);
    const coinTotal = amount * prices[index];

    data1[index] = { x: dates[index], y: (data1[index]?.y || 0) + coinTotal };
    // save per coin the total each day in the allData array
    if (!allData.has(crypto.id)) allData.set(crypto.id, []);
    allData.get(crypto.id)?.push(coinTotal);

    const cost = crypto.calculateCostOnDate(dates[index]);
    netInvested[index] = (netInvested[index] || 0) + cost;
  }
};

const createChart = () => {
  return new Chart(canvas1, {
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
            unit: "day",
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            // Include a dollar sign in the ticks
            callback: (value) => `$ ${value}`,
          },
        },
      },
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              let label = context.dataset.label || "";
              if (label) label += ": ";
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
          const activeEle = chart.getActiveElements();
          if (activeEle.length <= 0) return;

          const x = activeEle[0].element.x;
          const yAxis = chart.scales.y;
          const ctx = chart.ctx;

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
};

// Main Function
export async function prepareLineChart1() {
  if (store.getAssetsSize() === 0) {
    loader.classList.add("disabled");
    rateLimiting.classList.add("disabled");
    toggleDate.style.display = "none";
    return;
  }

  canvas1Parent.style.display = "none";
  toggleDate.style.display = "block";
  data1 = []; // Initialize as empty array
  netInvested = []; // Initialize as empty array
  allData.clear();

  let limited = false;
  loader.classList.remove("disabled");
  rateLimiting.classList.add("disabled");

  // Generate the full dates array for the selected date mode
  const fullDates = generateFullDatesArray(dateModeDays);
  let cacheMisses = 0;

  for (const [index, crypto] of store.getAssets().entries()) {
    const cacheKey = `getCoinChart_${crypto.id}_daily`;
    if (!isCacheValid(cacheKey) && cacheMisses > 0) {
      cacheMisses++;
      await sleep(Math.min(cacheMisses * SLEEP_TIME, 60_000));
    }

    const coinChartFull = await getCoinChart(crypto.id);
    const coinChart = coinChartFull.slice(coinChartFull.length - dateModeDays - 1); // get the last N days of data, based on selected dateMode

    if (coinChart.length === 0) {
      limited = true;
      break;
    }

    // Normalize the coinChart data to include all dates
    const normalizedCoinChart = normalizeCoinChart(coinChart, fullDates);

    if (index === 0) {
      // Use the normalized dates for the chart
      dates = normalizedCoinChart.map((data) => new Date(data[0]));
    }

    const prices = normalizedCoinChart.map((data) => data[1]);
    updateChartData(crypto, prices);
  }

  // If we are being rate limited, stop what we are doing since the data is incomplete
  if (limited) {
    rateLimiting.classList.remove("disabled");
    return;
  }

  if (lineChart1) lineChart1.destroy();
  loader.classList.add("disabled");
  if (store.getAssetsSize() > 0) canvas1Parent.style.display = "block";

  lineChart1 = createChart();

  for (const [key, value] of allData) {
    const color = store.getAssetById(key)?.color;
    const newDataSet = {
      data: value.map((d, i) => ({ x: dates[i], y: d })),
      label: key,
      backgroundColor: color,
      borderColor: color,
      hidden: true,
      pointRadius: 0,
      order: 0,
      borderWidth: 1,
    };
    lineChart1.data.datasets.push(newDataSet);
  }

  const netInvestedColor = "#c3f73a";
  const netInvestDataSet = {
    data: netInvested.map((net, i) => ({ x: dates[i], y: net })),
    label: "Net invested",
    backgroundColor: netInvestedColor,
    borderColor: netInvestedColor,
    hidden: true,
    pointRadius: 0,
    order: 1,
    borderWidth: 1,
  };
  lineChart1.data.datasets.push(netInvestDataSet);
  lineChart1.update();
}

// Date Mode Switching
const toggleWeekMode = document.getElementById("toggleWeekMode");
const toggleMonthMode = document.getElementById("toggleMonthMode");
const toggleYearMode = document.getElementById("toggleYearMode");

[toggleWeekMode, toggleMonthMode, toggleYearMode].forEach((element) => {
  element?.addEventListener("click", switchDateMode);
});

function switchDateMode(e: Event) {
  if (store.getAssetsSize() === 0) return;

  const target = e.target as HTMLButtonElement;

  // Remove other active classes
  [toggleWeekMode, toggleMonthMode, toggleYearMode].forEach((element) =>
    element?.classList.remove("active")
  );

  target.classList.add("active");

  const mode = target.value.toUpperCase();

  switch (mode) {
    case "WEEK":
      dateModeDays = 7;
      break;
    case "MONTH":
      dateModeDays = 30;
      break;
    case "YEAR":
      dateModeDays = 365;
      break;
    default:
      dateModeDays = 30;
  }
  prepareLineChart1();
}
