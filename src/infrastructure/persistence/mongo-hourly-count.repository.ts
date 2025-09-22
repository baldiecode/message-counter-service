import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
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
  private readonly logger = new Logger(MongoHourlyCountRepository.name);

  constructor(
    @InjectModel('HourlyCount') private readonly model: Model<HourlyCountDoc>,
  ) {}

  async incrementCount(
    accountId: AccountId,
    hourBucket: HourBucket,
  ): Promise<void> {
    try {
      await this.model.findOneAndUpdate(
        { accountId: accountId.toString(), hour: hourBucket.toString() },
        { $inc: { count: 1 }, $set: { lastUpdated: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      this.logger.log(
        `Incremented count for account ${accountId.toString()} at ${hourBucket.toString()}`,
      );
    } catch (error) {
      this.logger.error(
        `Error incrementing count for account ${accountId.toString()} at ${hourBucket.toString()}: ${error.message}`,
      );
      throw error;
    }
  }

  async findByRange(
    accountId: AccountId,
    from: Date | HourBucket,
    to: Date | HourBucket,
  ): Promise<HourlyCount[]> {
    try {
      const fromBucket =
        from instanceof HourBucket ? from : HourBucket.fromDate(from);
      const toBucket = to instanceof HourBucket ? to : HourBucket.fromDate(to);

      if (fromBucket.getValue() >= toBucket.getValue()) {
        throw new BadRequestException('from must be before to');
      }

      const query: FilterQuery<HourlyCountDoc> = {
        accountId: accountId.toString(),
        hour: { $gte: fromBucket.getValue(), $lt: toBucket.getValue() },
      };

      const docs = await this.model.find(query).sort({ hour: 1 }).lean();
      this.logger.log(
        `Found ${docs.length} hourly counts for account ${accountId.toString()} in range ${fromBucket.getValue()} to ${toBucket.getValue()}`,
      );
      return docs.map((d) => ({
        accountId,
        hourBucket: HourBucket.fromString(d.hour),
        count: d.count,
      }));
    } catch (error) {
      this.logger.error(
        `Error finding hourly counts for account ${accountId.toString()}: ${error.message}`,
      );
      throw error;
    }
  }
}
