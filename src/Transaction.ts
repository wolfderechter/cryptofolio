export class Transaction {
  constructor(private date: Date, public amount: number, public cost: number) {}

  get averageBuyPrice(): number {
    return this.cost / this.amount;
  }
}
