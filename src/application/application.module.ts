import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ProcessWebhookHandler } from './commands/process-webhook.handler';
import { GetCountsHandler } from './queries/get-counts.handler';

const CommandHandlers = [ProcessWebhookHandler];
const QueryHandlers = [GetCountsHandler];

@Module({
  imports: [CqrsModule],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [...CommandHandlers, ...QueryHandlers],
})
export class ApplicationModule {}
