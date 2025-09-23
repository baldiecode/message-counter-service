import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  HourlyCountRepository,
  HourlyCount,
} from '../../domain/ports/hourly-count.repository.port';
import { AccountId } from '../../domain/value-objects/account-id.vo';
import { HourBucket } from '../../domain/value-objects/hour-bucket.vo';

type HourlyCountDoc = {
  accountId: string;
  hour: string;
  count: number;
  lastUpdated: Date;
};

@Injectable()
export class MongoHourlyCountRepository implements HourlyCountRepository {
  constructor(
    @InjectModel('HourlyCount') private readonly model: Model<HourlyCountDoc>,
  ) {}

  async incrementCount(
    accountId: AccountId,
    hourBucket: HourBucket,
  ): Promise<void> {
    await this.model.updateOne(
      { accountId: accountId.getValue(), hour: hourBucket.getValue() },
      { $inc: { count: 1 }, $set: { lastUpdated: new Date() } },
      { upsert: true },
    );
  }

  async findByRange(
    accountId: AccountId,
    from: Date,
    to: Date,
  ): Promise<HourlyCount[]>;
  async findByRange(
    accountId: AccountId,
    from: HourBucket,
    to: HourBucket,
  ): Promise<HourlyCount[]>;
  async findByRange(
    accountId: AccountId,
    from: Date | HourBucket,
    to: Date | HourBucket,
  ): Promise<HourlyCount[]> {
    const fromValue =
      from instanceof Date
        ? HourBucket.fromDate(from).getValue()
        : from.getValue();
    const toValue =
      to instanceof Date ? HourBucket.fromDate(to).getValue() : to.getValue();

    const docs = await this.model
      .find({
        accountId: accountId.getValue(),
        hour: { $gte: fromValue, $lt: toValue },
      })
      .sort({ hour: 1 })
      .lean();

    return docs.map((doc) => ({
      accountId,
      hourBucket: HourBucket.fromString(doc.hour),
      count: doc.count,
    }));
  }
}
