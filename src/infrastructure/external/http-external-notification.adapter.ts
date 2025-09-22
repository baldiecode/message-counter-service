import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  ExternalNotificationService,
  DailyTotal,
} from '../../domain/ports/external-notification.port';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HttpExternalNotificationAdapter
  implements ExternalNotificationService
{
  private readonly logger = new Logger(HttpExternalNotificationAdapter.name);

  constructor(private readonly http: HttpService) {}

  async sendDailyTotal(d: DailyTotal): Promise<void> {
    const url =
      process.env.DAILY_TOTAL_ENDPOINT ||
      'http://localhost:3000/mock/daily-total';
    
    const payload = {
      account_id: d.accountId.toString(),
      date: d.day.getValue(),
      total_messages: d.totalMessages,
      last_update: d.lastUpdate.toISOString(),
    };

    try {
      const response = await firstValueFrom(
        this.http.post(url, payload)
      );
      
      this.logger.log(
        `Successfully sent daily total for account ${d.accountId.toString()} on ${d.day.getValue()}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send daily total for account ${d.accountId.toString()} on ${d.day.getValue()}: ${error.message}`,
      );
      // Don't throw - make it non-blocking
      // throw error;
    }
  }
}
