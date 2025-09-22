import {
  HourlyCountRepository,
  HOURLY_COUNT_REPOSITORY,
} from '../ports/hourly-count.repository.port';
import { DailyTotal } from '../ports/external-notification.port';
import { AccountId } from '../value-objects/account-id.vo';
import { DayBucket } from '../value-objects/day-bucket.vo';
import { Inject } from '@nestjs/common';

export class DailyTotalCalculator {
  constructor(
    @Inject(HOURLY_COUNT_REPOSITORY)
    private readonly hourlyCountRepository: HourlyCountRepository,
  ) {}

  async calculateForDay(
    accountId: AccountId,
    dayBucket: DayBucket,
  ): Promise<DailyTotal> {
    const from = dayBucket.toDate(); // 00:00:00Z of the UTC day
    const to = new Date(from.getTime() + 24 * 60 * 60 * 1000); // next day

    const hourlyCounts = await this.hourlyCountRepository.findByRange(
      accountId,
      from,
      to,
    );

    const totalMessages = hourlyCounts.reduce(
      (sum, hourlyCount) => sum + hourlyCount.count,
      0,
    );

    return {
      accountId,
      day: dayBucket,
      totalMessages,
      lastUpdate: new Date(),
    };
  }

  async calculateForDateRange(
    accountId: AccountId,
    from: DayBucket,
    to: DayBucket,
  ): Promise<DailyTotal[]> {
    const results: DailyTotal[] = [];

    // Generate all day buckets in the range [from, to)
    let currentDate = from.toDate();
    const endDate = to.toDate();

    while (currentDate < endDate) {
      const dayBucket = DayBucket.fromDate(currentDate);
      const dailyTotal = await this.calculateForDay(accountId, dayBucket);
      results.push(dailyTotal);

      // Move to next day (UTC) without mutating the same Date instance
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    return results;
  }
}
