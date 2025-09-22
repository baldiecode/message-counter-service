import { Schema } from 'mongoose';

export const MessageSchema = new Schema(
  {
    _id: { type: String, required: true }, // message_id
    accountId: { type: String, required: true },
    createdAt: { type: Date, required: true },
    metadata: { type: Object },
  },
  { _id: false, versionKey: false, collection: 'messages' },
);
MessageSchema.index({ _id: 1 }, { unique: true });
MessageSchema.index({ accountId: 1, createdAt: 1 });
