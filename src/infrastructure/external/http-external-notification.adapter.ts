import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  ExternalNotificationService,
  DailyTotal,
} from '../../domain/ports/external-notification.port';
import {
  firstValueFrom,
  catchError,
  retryWhen,
  delayWhen,
  timer,
  throwError,
  scan,
  take,
} from 'rxjs';
import { createHash } from 'crypto';

@Injectable()
export class HttpExternalNotificationAdapter
  implements ExternalNotificationService
{
  private readonly logger = new Logger(HttpExternalNotificationAdapter.name);

  constructor(private readonly http: HttpService) {}

  async sendDailyTotal(d: DailyTotal): Promise<void> {
    const url =
      process.env.DAILY_TOTAL_ENDPOINT ||
      'http://localhost:4000/mock/daily-total';
    const idempotencyKey = createHash('sha256')
      .update(`${d.accountId.toString()}-${d.day.getValue()}`)
      .digest('hex');
    const payload = {
      account_id: d.accountId.toString(),
      date: d.day.getValue(),
      total_messages: d.totalMessages,
      last_update: d.lastUpdate.toISOString(),
      idempotency_key: idempotencyKey,
    };

    try {
      await firstValueFrom(
        this.http.post(url, payload).pipe(
          retryWhen((errors) =>
            errors.pipe(
              scan((attempt, error) => attempt + 1, 0),
              take(3),
              delayWhen((attempt) => timer(1000 * 2 ** attempt)),
            ),
          ),
          catchError((error) => {
            this.logger.error(
              `Failed to send daily total for account ${d.accountId.toString()} on ${d.day.getValue()}: ${error.message}`,
            );
            throw error;
          }),
        ),
      );
      this.logger.log(
        `Successfully sent daily total for account ${d.accountId.toString()} on ${d.day.getValue()}`,
      );
    } catch (error) {
      this.logger.error(
        `All retries failed for daily total ${d.accountId.toString()} on ${d.day.getValue()}: ${error.message}`,
      );
      throw error;
    }
  }
}
