import { prepareLineChart1 } from "./LineChart";
import { preparePieChart1, preparePieChart2 } from "./PieChart";

export function renderCharts() {
  prepareLineChart1();
  preparePieChart1();
  preparePieChart2();
}
