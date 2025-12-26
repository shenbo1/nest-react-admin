import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AlertController],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertModule {}
