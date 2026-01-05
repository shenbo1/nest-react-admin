import { Module } from '@nestjs/common';
import { FullReductionController } from './full-reduction.controller';
import { FullReductionService } from './full-reduction.service';

@Module({
  controllers: [FullReductionController],
  providers: [FullReductionService],
  exports: [FullReductionService],
})
export class FullReductionModule {}
