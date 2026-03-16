import { Controller, Param, Sse, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MetricsService } from './metrics.service';

@UseGuards(JwtAuthGuard)
@Controller('instances/:id/metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Sse('stream')
  streamMetrics(@Param('id') id: string): Observable<MessageEvent> {
    return this.metricsService.streamMetrics(id);
  }
}
