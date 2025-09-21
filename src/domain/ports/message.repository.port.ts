import { Message } from '../entities/message.entity';
import { MessageId } from '../value-objects/message-id.vo';

export interface MessageRepository {
  save(message: Message): Promise<void>;
  findById(id: MessageId): Promise<Message | null>;
}
