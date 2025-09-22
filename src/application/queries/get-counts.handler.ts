import { Logger, BadRequestException, Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetCountsQuery } from './get-counts.query';
import type { HourlyCountRepository } from '../../domain/ports/hourly-count.repository.port';
import { HOURLY_COUNT_REPOSITORY } from '../../domain/ports/hourly-count.repository.port';
import { AccountId } from '../../domain/value-objects/account-id.vo';

export interface CountResult {
  account_id: string;
  datetime: string;
  count_messages: number;
}

@QueryHandler(GetCountsQuery)
export class GetCountsHandler
  implements IQueryHandler<GetCountsQuery, CountResult[]>
{
  private readonly logger = new Logger(GetCountsHandler.name);

  constructor(
    @Inject(HOURLY_COUNT_REPOSITORY)
    private readonly hourlyCountRepository: HourlyCountRepository,
  ) {}

  async execute(query: GetCountsQuery): Promise<CountResult[]> {
    this.logger.log(
      `Getting counts for accountId: ${query.accountId}, from: ${query.from}, to: ${query.to}`,
    );

    try {
      // 1. Validate and convert to domain objects
      const accountId = AccountId.fromString(query.accountId);
      const fromDate = new Date(query.from);
      const toDate = new Date(query.to);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new Error('Invalid date format: expected ISO 8601');
      }

      if (fromDate >= toDate) {
        throw new Error('from must be before to');
      }

      // Limit range to 30 days to prevent excessive queries
      const daysDifference = Math.ceil(
        (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysDifference > 30) {
        throw new Error('Range cannot exceed 30 days');
      }

      // 2. Query domain repository
      const hourlyCounts = await this.hourlyCountRepository.findByRange(
        accountId,
        fromDate,
        toDate,
      );

      // 3. Transform to API format
      return hourlyCounts.map((count) => ({
        account_id: count.accountId.getValue(),
        datetime: count.hourBucket.getValue(),
        count_messages: count.count,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get counts for accountId: ${query.accountId}, error: ${error.message}`,
      );
      throw new BadRequestException(
        `Invalid query parameters: ${error.message}`,
      );
    }
  }
}
