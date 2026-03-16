import { Module } from '@nestjs/common';
import { MetricDefinitionsController } from './metric-definitions.controller';
import { MetricDefinitionsService } from './metric-definitions.service';

@Module({
  controllers: [MetricDefinitionsController],
  providers: [MetricDefinitionsService],
})
export class MetricDefinitionsModule {}
