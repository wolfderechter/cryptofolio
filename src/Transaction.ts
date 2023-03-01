import { v4 as uuidv4 } from "uuid";

export class Transaction {
  public uuid: string;

  constructor(public type: transactionType, public date: Date, public amount: number, public cost: number, uuid?: string) {
    if (uuid) this.uuid = uuid;
    else this.uuid = uuidv4();
  }
}

export enum transactionType {
  Buy,
  Sell,
}
