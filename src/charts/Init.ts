import { cryptocurrencies } from "../main";
import { prepareLineChart1 } from "./LineChart";
import { preparePieChart1, preparePieChart2 } from "./PieChart";

export function renderCharts() {
  if (cryptocurrencies.length === 0) return;

  prepareLineChart1();
  preparePieChart1();
  preparePieChart2();
}
