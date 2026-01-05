import { Module } from '@nestjs/common';
import { PointRuleController } from './point-rule.controller';
import { PointRuleService } from './point-rule.service';

@Module({
  controllers: [PointRuleController],
  providers: [PointRuleService],
  exports: [PointRuleService],
})
export class PointRuleModule {}
