import { prepareLineChart1 } from "./LineChart";
import { preparePieChart1, preparePieChart2 } from "./PieChart";

export function renderCharts() {
  preparePieChart1();
  preparePieChart2();
  prepareLineChart1();
}
