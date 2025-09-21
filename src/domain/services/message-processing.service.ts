import { Message } from '../entities/message.entity';
import { MessageRepository } from '../ports/message.repository.port';
import { HourlyCountRepository } from '../ports/hourly-count.repository.port';
import {
  ExternalNotificationService,
  DailyTotal,
} from '../ports/external-notification.port';

export class MessageProcessingService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly hourlyCountRepository: HourlyCountRepository,
    private readonly notificationService: ExternalNotificationService,
  ) {}

  async processMessage(message: Message): Promise<void> {
    // Idempotency by messageId: no-op if already exists
    const existing = await this.messageRepository.findById(message.getId());
    if (existing) {
      return;
    }

    // Persist the message (repository must have unique index by message_id in infrastructure)
    await this.messageRepository.save(message);

    // Increment hourly count (UTC, truncated to hour) using VOs
    const hourBucket = message.getHourBucket();
    await this.hourlyCountRepository.incrementCount(
      message.getAccountId(),
      hourBucket,
    );

    // Calculate daily total and notify externally
    const dayBucket = message.getDayBucket();
    const from = dayBucket.toDate(); // 00:00:00Z of the UTC day
    const to = new Date(from.getTime() + 24 * 60 * 60 * 1000); // next day

    const series = await this.hourlyCountRepository.findByRange(
      message.getAccountId(),
      from,
      to,
    );
    const total = series.reduce((sum, it) => sum + it.count, 0);

    const dailyTotal: DailyTotal = {
      accountId: message.getAccountId(),
      day: dayBucket,
      totalMessages: total,
      lastUpdate: new Date(),
    };

    await this.notificationService.sendDailyTotal(dailyTotal);
  }
}
