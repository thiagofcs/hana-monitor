import { Injectable, NotFoundException } from '@nestjs/common';
import * as hdb from 'hdb';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

const MEMORY_QUERY = `
SELECT
    "Memory Usage"
FROM (
  SELECT
      ROUND(INSTANCE_TOTAL_MEMORY_USED_SIZE/1024/1024/1024, 2) AS "Memory Usage"
  FROM M_HOST_RESOURCE_UTILIZATION
)
`;

export interface MemoryMetrics {
  memoryUsageGb: number;
  timestamp: string;
}

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  streamMemory(instanceId: string, intervalMs = 5000): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      let client: hdb.Client | null = null;
      let timer: ReturnType<typeof setInterval> | null = null;
      let stopped = false;

      const cleanup = () => {
        stopped = true;
        if (timer) clearInterval(timer);
        if (client) {
          try { client.end(); } catch { /* ignore */ }
        }
      };

      this.prisma.hanaInstance
        .findUnique({ where: { id: instanceId } })
        .then((instance) => {
          if (!instance) {
            subscriber.error(new NotFoundException('Instance not found'));
            return;
          }
          if (stopped) return;

          client = hdb.createClient({
            host: instance.host,
            port: instance.port,
            user: instance.username,
            password: instance.password,
            useTLS: instance.useSsl,
          });

          client.connect((err: Error | null) => {
            if (err || stopped) {
              if (err) {
                subscriber.next({
                  data: { error: err.message },
                } as MessageEvent);
              }
              cleanup();
              subscriber.complete();
              return;
            }

            const poll = () => {
              if (stopped || !client) return;
              client.exec(MEMORY_QUERY, (execErr, rows) => {
                if (stopped) return;
                if (execErr) {
                  subscriber.next({
                    data: { error: execErr.message },
                  } as MessageEvent);
                  return;
                }

                const row = rows?.[0];
                const metrics: MemoryMetrics = {
                  memoryUsageGb: row ? Number(row['Memory Usage']) : 0,
                  timestamp: new Date().toISOString(),
                };

                subscriber.next({ data: metrics } as MessageEvent);
              });
            };

            // First poll immediately, then on interval
            poll();
            timer = setInterval(poll, intervalMs);
          });
        })
        .catch((e: Error) => {
          subscriber.next({ data: { error: e.message } } as MessageEvent);
          subscriber.complete();
        });

      // Cleanup when client disconnects
      return () => cleanup();
    });
  }
}
