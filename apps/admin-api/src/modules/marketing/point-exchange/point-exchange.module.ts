import { Module } from '@nestjs/common';
import { PointExchangeController } from './point-exchange.controller';
import { PointExchangeService } from './point-exchange.service';

@Module({
  controllers: [PointExchangeController],
  providers: [PointExchangeService],
  exports: [PointExchangeService],
})
export class PointExchangeModule {}
