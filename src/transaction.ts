import { v4 as uuidv4 } from "uuid";

export class Transaction {
  public uuid: string;

  constructor(
    public type: transactionType,
    public date: Date,
    public amount: number,
    public cost: number,
    uuid?: string
  ) {
    this.uuid = uuid || uuidv4();
  }
}

export enum transactionType {
  Buy = "Buy",
  Sell = "Sell",
}
