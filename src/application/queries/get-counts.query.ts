export class GetCountsQuery {
  constructor(
    public readonly accountId: string,
    public readonly from: string,
    public readonly to: string,
  ) {}
}
