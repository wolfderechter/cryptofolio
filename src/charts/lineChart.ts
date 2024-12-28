import { cryptocurrencies, SLEEP_TIME } from "../main";
import { Chart } from "chart.js/auto";
import { getCoinChart } from "../data/coingecko";
import "chartjs-adapter-date-fns";
import { isCacheValid } from "../data/cache";

// Constants
const DATE_MODES = {
  // Hourly chart has been disabled in the coingecko free api :(
  // DAY: { days: 1, interval: "hourly", arrayLength: 25 },
  WEEK: { days: 7, interval: "daily", arrayLength: 8 },
  MONTH: { days: 31, interval: "daily", arrayLength: 32 },
  YEAR: { days: 365, interval: "daily", arrayLength: 366 },
  ALL: { days: 0, interval: "daily", arrayLength: 0 }, // Special case
};

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
let allData: Map<string, any[]> = new Map();
let dates: Date[] = [];
let netInvested: number[] = [];

// Initialize Gradient
const totalValueGradient = canvas1
  .getContext("2d")
  ?.createLinearGradient(0, 25, 0, 300)!;
totalValueGradient.addColorStop(0, colors.purple.half);
totalValueGradient.addColorStop(0.5, colors.purple.quarter);
totalValueGradient.addColorStop(1, colors.purple.zero);

// Helper Functions
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Returns the max amount of days, based on the earliest transaction date
const calculateEarliestDate = () => {
  return cryptocurrencies
    .map((c) => c.transactionDates)
    .reduce((a, b) => (a > b ? a : b))[0];
};

const calculateDiffDays = (earliestDate: Date) => {
  const currentDate = new Date();
  const diffTime = Math.abs(currentDate.getTime() - earliestDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
            unit: dateModeInterval === "hourly" ? "hour" : "day",
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
  if (cryptocurrencies.length === 0) {
    loader.classList.add("disabled");
    rateLimiting.classList.add("disabled");
    toggleDate.style.display = "none";
    return;
  }

  canvas1Parent.style.display = "none";
  toggleDate.style.display = "block";
  data1 = Array(dateModeArrayLength).fill({ x: null, y: 0 });
  netInvested = [];
  allData.clear();

  let limited = false;
  loader.classList.remove("disabled");
  rateLimiting.classList.add("disabled");

  for (const [index, crypto] of cryptocurrencies.entries()) {
    const coinChart = await getCoinChart(
      crypto.id,
      dateModeDays,
      dateModeInterval
    );

    if (coinChart.length === 0) {
      limited = true;
      break;
    }

    if (index === 0) {
      dates = coinChart.map((data) => new Date(data[0]));
    }

    const prices = coinChart.map((data) => parseFloat(data[1]));
    updateChartData(crypto, prices);

    const cacheKey = `getCoinChart_${crypto.id}_${dateModeDays}_${dateModeInterval}`;
    if (!isCacheValid(cacheKey)) {
      await sleep(index * SLEEP_TIME + 750);
    }
  }

  // If we are being rate limited, stop what we are doing since the data is incomplete
  if (limited) {
    rateLimiting.classList.remove("disabled");
    return;
  }

  if (lineChart1) lineChart1.destroy();
  loader.classList.add("disabled");
  if (cryptocurrencies.length > 0) canvas1Parent.style.display = "block";

  lineChart1 = createChart();

  for (const [key, value] of allData) {
    const color = cryptocurrencies.find((c) => c.id === key)?.color;
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

// Date Mode Variables
let dateModeDays = DATE_MODES.MONTH.days;
let dateModeInterval = DATE_MODES.MONTH.interval;
let dateModeArrayLength = DATE_MODES.MONTH.arrayLength;

// Date Mode Switching
// const toggleDayMode = document.getElementById("toggleDayMode")!;
const toggleWeekMode = document.getElementById("toggleWeekMode")!;
const toggleMonthMode = document.getElementById("toggleMonthMode")!;
const toggleYearMode = document.getElementById("toggleYearMode")!;
const toggleAllMode = document.getElementById("toggleAllMode")!;

[
  // toggleDayMode,
  toggleWeekMode,
  toggleMonthMode,
  toggleYearMode,
  toggleAllMode,
].forEach((element) => {
  element.addEventListener("click", switchDateMode);
});

function switchDateMode(e: Event) {
  if (cryptocurrencies.length === 0) return;

  const target = e.target as HTMLButtonElement;

  // Remove other active classes
  [
    // toggleDayMode,
    toggleWeekMode,
    toggleMonthMode,
    toggleYearMode,
    toggleAllMode,
  ].forEach((element) => element.classList.remove("active"));

  target.classList.add("active");

  const mode = target.value.toUpperCase();
  if (mode === "ALL") {
    const earliestDate = calculateEarliestDate();
    dateModeDays = calculateDiffDays(earliestDate);
    dateModeInterval = DATE_MODES.ALL.interval;
    dateModeArrayLength = DATE_MODES.ALL.arrayLength;
  } else {
    const { days, interval, arrayLength } = DATE_MODES[mode];
    dateModeDays = days;
    dateModeInterval = interval;
    dateModeArrayLength = arrayLength;
  }

  prepareLineChart1();
}
