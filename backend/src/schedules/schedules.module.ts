import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { SchedulerRunnerService } from './scheduler-runner.service';

@Module({
  controllers: [SchedulesController],
  providers: [SchedulesService, SchedulerRunnerService],
})
export class SchedulesModule {}
