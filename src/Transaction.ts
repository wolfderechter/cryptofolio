export class Transaction {
  constructor(
    public type: transactionType,
    public date: Date,
    public amount: number,
    public cost: number
  ) {}
}

export enum transactionType {
  Buy,
  Sell,
}
