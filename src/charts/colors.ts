import { cryptocurrencies } from "../main";

export function getColor(cryptoId: string): string {
  // Get the existing colors and remove them from the list of predefined available colors
  const existingColors = cryptocurrencies.map((c) => c.color);
  existingColors.forEach((c) => {
    PREDEFINED_COLORS.splice(PREDEFINED_COLORS.indexOf(c));
  });

  if (cryptoId) {
    return PREDEFINED_COLORS[0];
  }
  return "#" + (((1 << 24) * Math.random()) | 0).toString(16).padStart(6, "0");
}

const PREDEFINED_COLORS = ["#a60bdb"];
