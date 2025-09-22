import { Message } from '../entities/message.entity';
import {
  MessageRepository,
  MESSAGE_REPOSITORY,
} from '../ports/message.repository.port';
import {
  HourlyCountRepository,
  HOURLY_COUNT_REPOSITORY,
} from '../ports/hourly-count.repository.port';
import {
  ExternalNotificationService,
  EXTERNAL_NOTIFICATION_SERVICE,
} from '../ports/external-notification.port';
import { DailyTotalCalculator } from './daily-total-calculator.service';
import { HourBucket } from '../value-objects/hour-bucket.vo';
import { DayBucket } from '../value-objects/day-bucket.vo';
import { Inject } from '@nestjs/common';

export class MessageProcessingService {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @Inject(HOURLY_COUNT_REPOSITORY)
    private readonly hourlyCountRepository: HourlyCountRepository,
    @Inject(EXTERNAL_NOTIFICATION_SERVICE)
    private readonly notificationService: ExternalNotificationService,
    private readonly dailyTotalCalculator: DailyTotalCalculator,
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
    const hourBucket = HourBucket.fromDate(message.getCreatedAt());
    await this.hourlyCountRepository.incrementCount(
      message.getAccountId(),
      hourBucket,
    );

    // Calculate daily total and notify externally
    const dayBucket = DayBucket.fromDate(message.getCreatedAt());
    const dailyTotal = await this.dailyTotalCalculator.calculateForDay(
      message.getAccountId(),
      dayBucket,
    );

    await this.notificationService.sendDailyTotal(dailyTotal);
  }
}
