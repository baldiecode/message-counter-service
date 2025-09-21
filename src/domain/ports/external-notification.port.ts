import { AccountId } from '../value-objects/account-id.vo';
import { DayBucket } from '../value-objects/day-bucket.vo';

/**
 * Daily aggregated total of messages for an account, in UTC day precision.
 * - day uses canonical UTC calendar format (YYYY-MM-DD), wrapped in DayBucket.
 * - lastUpdate is an instant (Date) when the total was computed/refreshed (UTC).
 */
export interface DailyTotal {
  accountId: AccountId;
  day: DayBucket;
  totalMessages: number;
  lastUpdate: Date;
}

/**
 * Port for notifying an external system with the daily total.
 *
 * Requirements and guarantees:
 * - Idempotent by (accountId, day): invoking multiple times with the same pair must be safe.
 * - At-least-once delivery: adapter should implement retries/backoff; exact strategy is infra concern.
 * - The adapter maps domain types to the external wire format (e.g., HTTP JSON payload).
 */
export interface ExternalNotificationService {
  sendDailyTotal(dailyTotal: DailyTotal): Promise<void>;
}
