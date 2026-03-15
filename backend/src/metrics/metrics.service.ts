import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import * as hdb from 'hdb';
import { Observable, Subject } from 'rxjs';
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
  error?: string;
}

interface InstancePoller {
  subject: Subject<MemoryMetrics>;
  client: hdb.Client | null;
  timer: ReturnType<typeof setInterval> | null;
  subscribers: number;
}

@Injectable()
export class MetricsService implements OnModuleDestroy {
  private pollers = new Map<string, InstancePoller>();

  constructor(private readonly prisma: PrismaService) {}

  onModuleDestroy() {
    for (const [id] of this.pollers) {
      this.stopPoller(id);
    }
  }

  streamMemory(instanceId: string, intervalMs = 5000): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      let started = false;

      this.startPoller(instanceId, intervalMs)
        .then((poller) => {
          started = true;
          const sub = poller.subject.subscribe((metrics) => {
            subscriber.next({ data: metrics } as MessageEvent);
          });

          // When this SSE client disconnects, unsubscribe and maybe stop the poller
          subscriber.add(() => {
            sub.unsubscribe();
            this.removeSubscriber(instanceId);
          });
        })
        .catch((err: Error) => {
          subscriber.next({ data: { error: err.message } } as MessageEvent);
          subscriber.complete();
        });

      return () => {
        if (started) {
          this.removeSubscriber(instanceId);
        }
      };
    });
  }

  private async startPoller(instanceId: string, intervalMs: number): Promise<InstancePoller> {
    const existing = this.pollers.get(instanceId);
    if (existing) {
      existing.subscribers++;
      return existing;
    }

    const instance = await this.prisma.hanaInstance.findUnique({
      where: { id: instanceId },
    });
    if (!instance) throw new NotFoundException('Instance not found');

    const poller: InstancePoller = {
      subject: new Subject<MemoryMetrics>(),
      client: null,
      timer: null,
      subscribers: 1,
    };
    this.pollers.set(instanceId, poller);

    const client = hdb.createClient({
      host: instance.host,
      port: instance.port,
      user: instance.username,
      password: instance.password,
      useTLS: instance.useSsl,
    });
    poller.client = client;

    return new Promise((resolve, reject) => {
      client.connect((err: Error | null) => {
        if (err) {
          this.pollers.delete(instanceId);
          reject(err);
          return;
        }

        const poll = () => {
          client.exec(MEMORY_QUERY, (execErr, rows) => {
            if (execErr) {
              poller.subject.next({
                memoryUsageGb: 0,
                timestamp: new Date().toISOString(),
                error: execErr.message,
              });
              return;
            }

            const row = rows?.[0];
            poller.subject.next({
              memoryUsageGb: row ? Number(row['Memory Usage']) : 0,
              timestamp: new Date().toISOString(),
            });
          });
        };

        poll();
        poller.timer = setInterval(poll, intervalMs);
        resolve(poller);
      });
    });
  }

  private removeSubscriber(instanceId: string) {
    const poller = this.pollers.get(instanceId);
    if (!poller) return;

    poller.subscribers--;
    if (poller.subscribers <= 0) {
      this.stopPoller(instanceId);
    }
  }

  private stopPoller(instanceId: string) {
    const poller = this.pollers.get(instanceId);
    if (!poller) return;

    if (poller.timer) clearInterval(poller.timer);
    if (poller.client) {
      try { poller.client.end(); } catch { /* ignore */ }
    }
    poller.subject.complete();
    this.pollers.delete(instanceId);
  }
}
