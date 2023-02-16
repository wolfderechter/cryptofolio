export class Transaction {
  constructor(public date: Date, public amount: number, public cost: number) {}

  get averageBuyPrice(): number {
    return this.cost / this.amount;
  }
}
