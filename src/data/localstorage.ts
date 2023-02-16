import { CryptoCurrency } from "../Cryptocurrency";
import { cryptocurrencies } from "../main";
import { Transaction } from "../Transaction";

export function saveData() {
  localStorage.setItem("assets", JSON.stringify(cryptocurrencies));
}

export function loadData() {
  const cryptos = localStorage.getItem("assets");
  if (cryptos == null) return;

  // Recreate the objects from JSON
  JSON.parse(cryptos).forEach((crypto: any) => {
    let newCrypto = new CryptoCurrency(crypto.id, crypto.symbol, crypto.name);

    crypto.transactions.forEach((transaction: any) => {
      newCrypto.addTransaction(
        new Transaction(
          new Date(transaction.date),
          transaction.amount,
          transaction.cost
        )
      );
    });

    cryptocurrencies.push(newCrypto);
  });
}
