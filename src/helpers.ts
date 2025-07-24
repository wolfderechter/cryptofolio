
export function humanReadableNumber(value: number): string {
  if (value >= 100) {
    return value.toFixed(0);
  } else if (value >= 1) {
    return value.toFixed(2);
  } else {
    return value.toFixed(4);
  }
}
