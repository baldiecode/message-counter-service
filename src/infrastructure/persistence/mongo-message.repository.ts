import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseError } from 'mongoose';
import { MessageRepository } from '../../domain/ports/message.repository.port';
import { Message } from '../../domain/entities/message.entity';
import { MessageId } from '../../domain/value-objects/message-id.vo';
import { AccountId } from '../../domain/value-objects/account-id.vo';

type MessageDoc = {
  _id: string;
  accountId: string;
  createdAt: Date;
  metadata?: Record<string, any>;
};

@Injectable()
export class MongoMessageRepository implements MessageRepository {
  private readonly logger = new Logger(MongoMessageRepository.name);

  constructor(
    @InjectModel('Message') private readonly model: Model<MessageDoc>,
  ) {}

  async save(message: Message): Promise<void> {
    try {
      await this.model.create({
        _id: message.getId().toString(),
        accountId: message.getAccountId().toString(),
        createdAt: message.getCreatedAt(),
        metadata: message.getMetadata(),
      });
      this.logger.log(`Message saved: ${message.getId().toString()}`);
    } catch (error) {
      if (error.code === 11000) {
        this.logger.warn(
          `Duplicate message attempted: ${message.getId().toString()}`,
        );
      } else {
        this.logger.error(
          `Error saving message ${message.getId().toString()}: ${error.message}`,
        );
      }
      throw error;
    }
  }

  async findById(messageId: MessageId): Promise<Message | null> {
    try {
      const doc = await this.model.findById(messageId.toString()).lean();
      if (!doc) {
        this.logger.debug(`Message not found: ${messageId.toString()}`);
        return null;
      }
      this.logger.debug(`Message found: ${messageId.toString()}`);
      return new Message(
        new MessageId(doc._id),
        AccountId.fromString(doc.accountId),
        new Date(doc.createdAt),
        doc.metadata ?? {},
      );
    } catch (error) {
      this.logger.error(
        `Error finding message ${messageId.toString()}: ${error.message}`,
      );
      throw error;
    }
  }
}
