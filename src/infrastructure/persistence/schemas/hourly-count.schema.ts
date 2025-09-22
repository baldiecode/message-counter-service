import { Schema } from 'mongoose';

export const HourlyCountSchema = new Schema(
  {
    accountId: { type: String, required: true },
    hour: { type: String, required: true }, // YYYY-MM-DDTHH:00:00Z
    count: { type: Number, required: true, default: 0, min: 0 },
    lastUpdated: { type: Date, required: true, default: () => new Date() },
  },
  { versionKey: false, collection: 'hourly_counts' },
);
HourlyCountSchema.index({ accountId: 1, hour: 1 }, { unique: true });
HourlyCountSchema.index({ hour: 1 });
