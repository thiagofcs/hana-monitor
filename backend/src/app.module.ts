import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { InstancesModule } from './instances/instances.module';
import { MetricsModule } from './metrics/metrics.module';
import { MetricDefinitionsModule } from './metric-definitions/metric-definitions.module';
import { SchedulesModule } from './schedules/schedules.module';

@Module({
  imports: [PrismaModule, AuthModule, InstancesModule, MetricsModule, MetricDefinitionsModule, SchedulesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
