import { Transaction } from "./Transaction";

export class CryptoCurrency {
  public transactions: Transaction[];
  public color: string;
  public id: string;
  public symbol: string;
  public name: string;

  constructor(id: string, symbol: string, name: string, color?: string) {
    this.id = id;
    this.symbol = symbol;
    this.name = name;
    this.transactions = new Array<Transaction>();
    this.color = color
      ? color
      : "#" + (((1 << 24) * Math.random()) | 0).toString(16).padStart(6, "0");
  }

  addTransaction(transaction: Transaction) {
    this.transactions.push(transaction);
  }

  // use uuid here?
  removeTransaction(transaction: Transaction) {
    this.transactions.splice(this.transactions.indexOf(transaction), 1);
  }

  /* 
    Loop through the transactions, if the date of the transaction is smaller than or equal to the given date
    we include the transaction amount in the total sum
    
    if the date of transaction is after the given date we don't include the transaction amount
   */
  calculateAmountOnDate(date: Date) {
    return this.transactions.reduce((sum, current) => {
      if (current.date <= date) return sum + current.amount;

      return sum;
    }, 0);
  }
  calculateCostOnDate(date: Date) {
    return this.transactions.reduce((sum, current) => {
      if (current.date <= date) return sum + current.cost;

      return sum;
    }, 0);
  }

  get totalAmount(): number {
    return this.transactions.reduce((sum, current) => sum + current.amount, 0);
  }

  get totalCost(): number {
    return this.transactions.reduce((sum, current) => sum + current.cost, 0);
  }

  get averagePrice(): number {
    return this.totalCost / this.totalAmount;
  }
}

export interface Coin {
  id: string;
  name: string;
  symbol: string;
}
