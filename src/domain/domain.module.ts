import { Module } from '@nestjs/common';
import { MessageProcessingService } from './services/message-processing.service';
import { DailyTotalCalculator } from './services/daily-total-calculator.service';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

@Module({
  imports: [InfrastructureModule],
  providers: [MessageProcessingService, DailyTotalCalculator],
  exports: [MessageProcessingService, DailyTotalCalculator],
})
export class DomainModule {}
