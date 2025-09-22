import { Message } from '../entities/message.entity';
import { MessageId } from '../value-objects/message-id.vo';

export interface MessageRepository {
  save(message: Message): Promise<void>;
  findById(messageId: MessageId): Promise<Message | null>;
}

// NestJS injection token for the MessageRepository port
export const MESSAGE_REPOSITORY = Symbol('MessageRepository');
