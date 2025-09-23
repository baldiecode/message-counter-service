import { Module } from '@nestjs/common';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ApplicationModule } from './application/application.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [InfrastructureModule, ApplicationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
