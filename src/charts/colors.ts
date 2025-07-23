import { cryptocurrencies } from "../main";

const PREDEFINED_COLORS = [
  "#29B6F6CC", // Electric Blue (80% opacity)
  "#F92672CC", // Laser Pink (80% opacity)
  "#4A0D67CC", // Deep Space Purple (80% opacity)
  "#66D9EFCC", // Glitch Cyan (80% opacity)
  "#FD971FCC", // Flamingo Pink (80% opacity)
  "#FF6B00CC", // Sunset Orange (80% opacity)
  "#AE81FFCC", // Amethyst Glow (80% opacity)
  "#A6E22ECC", // Android Green (80% opacity)
  "#F4BF75CC", // Retro Gold (80% opacity)
  "#E040FBCC", // Fuchsia Flash (80% opacity)
  "#00E5FFCC", // Aqua Marine (80% opacity)
  "#D81B60CC", // Crimson Drive (80% opacity)
]; // Add more colors as needed

export function getColor(existingColors?: Set<string>): string {
  // Get the existing colors
  if (!existingColors)
    existingColors = new Set(cryptocurrencies.map((c) => c.color));

  // Find the first predefined color that hasn't been used yet
  const availableColor = PREDEFINED_COLORS.find(
    (color) => !existingColors.has(color)
  );

  // If an available predefined color is found, return it
  if (availableColor) {
    return availableColor;
  }

  // If all predefined colors are used, return a random color
  return `#${(((1 << 24) * Math.random()) | 0).toString(16).padStart(6, "0")}`;
}
