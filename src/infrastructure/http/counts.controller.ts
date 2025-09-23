import { Controller, Get, Query, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetCountsQueryDto } from './dtos/get-counts.query.dto';
import { GetCountsQuery } from '../../application/queries/get-counts.query';
import { CountResult } from '../../application/queries/get-counts.handler';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('counts')
@Controller()
export class CountsController {
  private readonly logger = new Logger(CountsController.name);

  constructor(private readonly queryBus: QueryBus) {}

  @Get('counts')
  @ApiOperation({ summary: 'Get hourly message counts in a time range' })
  @ApiOkResponse({
    description: 'Array of hourly counts',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        required: ['account_id', 'datetime', 'count_messages'],
        properties: {
          account_id: { type: 'string', description: 'Account identifier' },
          datetime: {
            type: 'string',
            format: 'date-time',
            description: 'Hour bucket (ISO 8601)',
          },
          count_messages: {
            type: 'integer',
            format: 'int32',
            description: 'Messages received within the hour',
          },
        },
      },
    },
  })
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
