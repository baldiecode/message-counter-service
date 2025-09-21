import { MessageId } from '../value-objects/message-id.vo';
import { AccountId } from '../value-objects/account-id.vo';

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

  getHourBucket(): string {
    const date = new Date(this.createdAt);
    date.setMinutes(0, 0, 0);
    return date.toDateString();
  }

  getDayKey(): string {
    return this.createdAt.toISOString().split('T')[0];
  }
}
