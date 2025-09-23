import { Body, Controller, Post, HttpCode, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { WebhookMessageDto } from './dtos/webhook-message.dto';
import { ProcessWebhookCommand } from '../../application/commands/process-webhook.command';
import { ApiTags, ApiOperation, ApiAcceptedResponse } from '@nestjs/swagger';

@ApiTags('webhook')
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(202)
  @ApiOperation({ summary: 'Receive webhook with a message event' })
  @ApiAcceptedResponse({ description: 'Webhook accepted for async processing' })
  async receive(@Body() dto: WebhookMessageDto): Promise<void> {
    this.logger.log(
      `Received webhook for messageId: ${dto.message_id}, accountId: ${dto.account_id}`,
    );
    await this.commandBus.execute(
      new ProcessWebhookCommand(
        dto.message_id,
        dto.account_id,
        dto.created_at,
        dto.metadata ?? {},
      ),
    );
  }
}
