import { Controller, Get, Query, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetCountsQueryDto } from './dtos/get-counts.query.dto';
import { GetCountsQuery } from '../../application/queries/get-counts.query';
import { CountResult } from '../../application/queries/get-counts.handler';

@Controller()
export class CountsController {
  private readonly logger = new Logger(CountsController.name);

  constructor(private readonly queryBus: QueryBus) {}

  @Get('counts')
  async getCounts(@Query() q: GetCountsQueryDto): Promise<CountResult[]> {
    this.logger.log(
      `Getting counts for accountId: ${q.account_id}, from: ${q.from}, to: ${q.to}`,
    );
    const results = await this.queryBus.execute(
      new GetCountsQuery(q.account_id, q.from, q.to),
    );
    return results;
  }
}
