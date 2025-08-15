import type { Cryptocurrency } from "../cryptocurrency";

const cryptocurrencies = new Map<string, Cryptocurrency>();

export function getAssets(): Cryptocurrency[] {
  const assetsArray = Array.from(cryptocurrencies.values());
  return assetsArray;
}

export function getAssetsSize(): number {
  return cryptocurrencies.size;
}

export function clearAssets() {
  cryptocurrencies.clear();
}

export function addAsset(crypto: Cryptocurrency) {
  cryptocurrencies.set(crypto.id, crypto);
}

export function getAssetById(id: string): Cryptocurrency | undefined {
  return cryptocurrencies.get(id);
}

export function removeAsset(id: string) {
  cryptocurrencies.delete(id);
}

export function updateAsset(id: string, updatedData: Partial<Cryptocurrency>) {
  const asset = cryptocurrencies.get(id);
  if (asset) {
    Object.assign(asset, updatedData);
    cryptocurrencies.set(id, asset);
  }
}
