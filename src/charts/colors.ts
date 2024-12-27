import { cryptocurrencies } from "../main";

const PREDEFINED_COLORS = ["#a60bdb"]; // Add more colors as needed

export function getColor(): string {
  // Get the existing colors
  const existingColors = new Set(cryptocurrencies.map((c) => c.color));

  // Find the first predefined color that hasn't been used yet
  const availableColor = PREDEFINED_COLORS.find(
    (color) => !existingColors.has(color)
  );

  // If an available predefined color is found, return it
  if (availableColor) {
    return availableColor;
  }

  // If all predefined colors are used, return a random color
  return "#" + (((1 << 24) * Math.random()) | 0).toString(16).padStart(6, "0");
}
