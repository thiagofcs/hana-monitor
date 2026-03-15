import { Controller, Param, Query, Sse, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MetricsService } from './metrics.service';

@UseGuards(JwtAuthGuard)
@Controller('instances/:id/metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Sse('memory')
  streamMemory(
    @Param('id') id: string,
    @Query('interval') interval?: string,
  ): Observable<MessageEvent> {
    const intervalMs = interval ? parseInt(interval, 10) * 1000 : 5000;
    return this.metricsService.streamMemory(id, intervalMs);
  }
}
