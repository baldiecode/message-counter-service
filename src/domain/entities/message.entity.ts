import { MessageId } from '../value-objects/message-id.vo';
import { AccountId } from '../value-objects/account-id.vo';
import { HourBucket } from '../value-objects/hour-bucket.vo';
import { DayBucket } from '../value-objects/day-bucket.vo';

export class Message {
  constructor(
    private readonly id: MessageId,
    private readonly accountId: AccountId,
    private readonly createdAt: Date,
    private readonly metadata: Record<string, any>,
  ) {}

  getId(): MessageId {
    return this.id;
  }

  getAccountId(): AccountId {
    return this.accountId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getMetadata(): Record<string, any> {
    return this.metadata;
  }

  getHourBucket(): HourBucket {
    return HourBucket.fromDate(this.createdAt);
  }

  getDayBucket(): DayBucket {
    return DayBucket.fromDate(this.createdAt);
  }
}
