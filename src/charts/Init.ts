import { prepareLineChart1 } from "./lineChart";
import { preparePieChart1, preparePieChart2 } from "./pieChart";

export function renderCharts() {
  prepareLineChart1();
  preparePieChart1();
  preparePieChart2();
}
