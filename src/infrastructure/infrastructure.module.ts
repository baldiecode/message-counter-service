import { Global, Module, OnModuleInit, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { CqrsModule } from '@nestjs/cqrs';
import { MongoMessageRepository } from './persistence/mongo-message.repository';
import { MongoHourlyCountRepository } from './persistence/mongo-hourly-count.repository';
import { HttpExternalNotificationAdapter } from './external/http-external-notification.adapter';
import { MessageSchema } from './persistence/schemas/message.schema';
import { HourlyCountSchema } from './persistence/schemas/hourly-count.schema';
import { MESSAGE_REPOSITORY } from '../domain/ports/message.repository.port';
import { HOURLY_COUNT_REPOSITORY } from '../domain/ports/hourly-count.repository.port';
import { EXTERNAL_NOTIFICATION_SERVICE } from '../domain/ports/external-notification.port';
import { WebhookController } from './http/webhook.controller';
import { CountsController } from './http/counts.controller';
import { MockExternalController } from './external/mock-external.controller';
import { ProcessWebhookHandler } from '../application/commands/process-webhook.handler';
import { GetCountsHandler } from '../application/queries/get-counts.handler';

@Global()
@Module({
  imports: [
    CqrsModule,
    HttpModule.register({ timeout: 5000 }),
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/message_counter',
    ),
    MongooseModule.forFeature([
      { name: 'Message', schema: MessageSchema },
      { name: 'HourlyCount', schema: HourlyCountSchema },
    ]),
  ],
  controllers: [WebhookController, CountsController, MockExternalController],
  providers: [
    { provide: MESSAGE_REPOSITORY, useClass: MongoMessageRepository },
    { provide: HOURLY_COUNT_REPOSITORY, useClass: MongoHourlyCountRepository },
    {
      provide: EXTERNAL_NOTIFICATION_SERVICE,
      useClass: HttpExternalNotificationAdapter,
    },
  ],
  exports: [
    MESSAGE_REPOSITORY,
    HOURLY_COUNT_REPOSITORY,
    EXTERNAL_NOTIFICATION_SERVICE,
  ],
})
export class InfrastructureModule implements OnModuleInit {
  private readonly logger = new Logger(InfrastructureModule.name);

  onModuleInit() {
    const mongoUri =
      process.env.MONGO_URI || 'mongodb://localhost:27017/message_counter';
    this.logger.log(`Connecting to MongoDB at ${mongoUri}`);
  }
}
