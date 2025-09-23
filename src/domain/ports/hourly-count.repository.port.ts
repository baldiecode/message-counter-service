import { AccountId } from '../value-objects/account-id.vo';
import { HourBucket } from '../value-objects/hour-bucket.vo';

/**
 * Aggregate count for a given account and UTC hour bucket.
 */
export interface HourlyCount {
  /**
   * Strongly-typed account identifier (acc_<uuid-v4>).
   */
  accountId: AccountId;

  /**
   * Canonical UTC hour bucket: YYYY-MM-DDTHH:00:00Z.
   */
  hourBucket: HourBucket;

  /**
   * Non-negative accumulated count within that hour bucket.
   */
  count: number;
}

export interface HourlyCountRepository {
  /**
   * Atomically increment the count for the given account and hour bucket.
   *
   * Semantics:
   * - Upsert + increment: if the (accountId, hourBucket) bucket does not exist, create it with count = 0, then increment to 1.
   * - Must be atomic to avoid race conditions under concurrent increments.
   */
  incrementCount(accountId: AccountId, hourBucket: HourBucket): Promise<void>;

  /**
   * Retrieve series of hourly counts for an account in a time range.
   *
   * Range semantics:
   * - [from, to) — inclusive of "from", exclusive of "to".
   * - Both boundaries are interpreted in UTC.
   * - Results MUST be sorted ascending by hourBucket.
   *
   * Overloads:
   * - Accepts Date boundaries (will be truncated to their UTC hour buckets).
   * - Accepts HourBucket boundaries directly.
   */
  findByRange(
    accountId: AccountId,
    from: Date,
    to: Date,
  ): Promise<HourlyCount[]>;
  findByRange(
    accountId: AccountId,
    from: HourBucket,
    to: HourBucket,
  ): Promise<HourlyCount[]>;
}

// NestJS injection token for the HourlyCountRepository port
export const HOURLY_COUNT_REPOSITORY = Symbol('HourlyCountRepository');
