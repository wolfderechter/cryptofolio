import { Transaction, transactionType } from "./Transaction";

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
    this.color = color ? color : "#" + (((1 << 24) * Math.random()) | 0).toString(16).padStart(6, "0");
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
      if (current.date <= date) {
        if (current.type === transactionType.Buy) return sum + current.amount;
        else return sum - current.amount;
      }

      return sum;
    }, 0);
  }
  calculateCostOnDate(date: Date) {
    return this.transactions.reduce((sum, current) => {
      if (current.date <= date) {
        if (current.type === transactionType.Buy) return sum + current.cost;
        else return sum - current.cost;
      }
      return sum;
    }, 0);
  }

  get totalAmount(): number {
    return this.transactions.reduce((sum, current) => {
      if (current.type === transactionType.Buy) return sum + current.amount;
      else return sum - current.amount;
    }, 0);
  }
  get totalBuyAmount(): number {
    return this.transactions.reduce((sum, current) => {
      if (current.type === transactionType.Buy) return sum + current.amount;
      else return sum;
    }, 0);
  }

  get totalCost(): number {
    return this.transactions.reduce((sum, current) => {
      if (current.type === transactionType.Buy) return sum + current.cost;
      else return sum - current.cost;
    }, 0);
  }
  get totalBuyCost(): number {
    return this.transactions.reduce((sum, current) => {
      if (current.type === transactionType.Buy) return sum + current.cost;
      else return sum;
    }, 0);
  }

  get averageBuyPrice(): number {
    return this.totalBuyCost / this.totalBuyAmount;
  }

  get amountOfTransactions(): number {
    return this.transactions.length;
  }

  get transactionDates(): Date[] {
    return this.transactions.map((t) => t.date);
  }
}

export interface Coin {
  id: string;
  name: string;
  symbol: string;
}
