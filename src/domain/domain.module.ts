import { Module } from '@nestjs/common';
import { MessageProcessingService } from './services/message-processing.service';
import { DailyTotalCalculator } from './services/daily-total-calculator.service';

@Module({
  providers: [MessageProcessingService, DailyTotalCalculator],
  exports: [MessageProcessingService, DailyTotalCalculator],
})
export class DomainModule {}
