import { Transaction } from "./Transaction";

export class CryptoCurrency {
  private transactions: Transaction[];
  // defining private/public inits the values, so no need to manually do this.id = id
  constructor(public id: string, public symbol: string, public name: string) {
    this.transactions = new Array<Transaction>();
  }

  addTransaction(transaction: Transaction) {
    this.transactions.push(transaction);
  }

  // use uuid here?
  removeTransaction(transaction: Transaction) {
    this.transactions.splice(this.transactions.indexOf(transaction), 1);
  }

  get totalAmount(): number {
    return this.transactions.reduce((sum, current) => sum + current.amount, 0);
  }

  get totalCost(): number {
    return this.transactions.reduce((sum, current) => sum + current.cost, 0);
  }

  get averageBuyPrice(): number {
    return this.totalCost / this.totalAmount;
  }
}

export interface Coin {
  id: string;
  name: string;
  symbol: string;
}
