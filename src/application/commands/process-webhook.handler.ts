import { Logger, BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ProcessWebhookCommand } from './process-webhook.command';
import { MessageProcessingService } from '../../domain/services/message-processing.service';
import { Message } from '../../domain/entities/message.entity';
import { MessageId } from '../../domain/value-objects/message-id.vo';
import { AccountId } from '../../domain/value-objects/account-id.vo';

@CommandHandler(ProcessWebhookCommand)
export class ProcessWebhookHandler
  implements ICommandHandler<ProcessWebhookCommand>
{
  private readonly logger = new Logger(ProcessWebhookHandler.name);

  constructor(
    private readonly messageProcessingService: MessageProcessingService,
  ) {}

  async execute(command: ProcessWebhookCommand): Promise<void> {
    this.logger.log(
      `Processing webhook for messageId: ${command.messageId}, accountId: ${command.accountId}`,
    );

    try {
      // 1. Create domain objects from raw data (validate and convert)
      const messageId = new MessageId(command.messageId);
      const accountId = AccountId.fromString(command.accountId);
      const createdAt = new Date(command.createdAt);

      // Additional validation for createdAt
      if (isNaN(createdAt.getTime())) {
        throw new Error('Invalid createdAt format: expected ISO 8601 string');
      }

      const message = new Message(
        messageId,
        accountId,
        createdAt,
        command.metadata,
      );

      // 2. Process through domain service
      await this.messageProcessingService.processMessage(message);

      this.logger.log(
        `Successfully processed webhook for messageId: ${command.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process webhook for messageId: ${command.messageId}, error: ${error.message}`,
      );
      throw new BadRequestException(`Invalid webhook data: ${error.message}`);
    }
  }
}
