export interface HourlyCount {
  accountId: string;
  hourTimestamp: string;
  count: number;
}

export interface HourlyCountRepository {
  incrementCount(accountId: string, hourBucket: string): Promise<void>;
  findByRange(accountId: string, from: Date, to: Date): Promise<HourlyCount[]>;
}
