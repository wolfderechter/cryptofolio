import { cryptocurrencies } from "../main";
import { Chart } from "chart.js/auto";
import { getCoinChart } from "../data/Coingecko";

let canvas1 = <HTMLCanvasElement>document.getElementById("lineChart1");
let lineChart1: Chart<"pie", number[], string>;
let data1: { x: number; y: number }[] = [];
let coinChart: string[] = [];

/* 
    The portfolio line chart consist of the value of the portfolio during the last x amount of days

    Each day it should show the portfolio value at that time by combining all the amount of crypto held * price of that crypto during that day
*/
export async function prepareLineChart1() {
  console.log(cryptocurrencies);
  cryptocurrencies.forEach(async (crypto, ind) => {
    if (ind != 0) return;
    // By default prepare the chart for the last 100 days
    /* 
        Returns an array of:
        [
        1675728000000 //Unix timestamp)
        22786.483006387727 //price during that day
        ]
    */
    coinChart = await getCoinChart(crypto.id, 5);

    for (let index = 0; index < coinChart.length; index++) {
      const chartElement = coinChart[index];

      // calculate how much of a coin I have on a certain date
      let date = new Date(1000 * parseInt(chartElement[0]));
      let coinAmount = crypto.calculateCoinAmountOnDate(date);
      let coinTotal = coinAmount * parseFloat(chartElement[1]);

      data1.push({ x: index, y: coinTotal });
    }
    console.log(data1);
  });
}

prepareLineChart1();
