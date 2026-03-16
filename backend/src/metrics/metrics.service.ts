import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import * as hdb from 'hdb';
import { Observable, Subject } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

export interface MetricResult {
  metricId: string;
  value: number | null;
  timestamp: string;
  error?: string;
}

/**
 * One HANA connection per instance, shared across all metrics and SSE clients.
 * Each metric runs its own polling interval on the shared connection.
 */
interface MetricPoller {
  timer: ReturnType<typeof setInterval>;
  subscribers: number;
}

interface InstanceConnection {
  client: hdb.Client;
  subject: Subject<MetricResult>;
  metricPollers: Map<string, MetricPoller>;
  subscribers: number;
}

@Injectable()
export class MetricsService implements OnModuleDestroy {
  private connections = new Map<string, InstanceConnection>();

  constructor(private readonly prisma: PrismaService) {}

  onModuleDestroy() {
    for (const [id] of this.connections) {
      this.teardownConnection(id);
    }
  }

  /**
   * Stream all metric results for a given instance.
   * Each SSE client subscribes to the shared subject.
   */
  streamMetrics(instanceId: string): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      let connected = false;

      this.ensureConnection(instanceId)
        .then((conn) => {
          connected = true;
          const sub = conn.subject.subscribe((result) => {
            subscriber.next({ data: result } as MessageEvent);
          });

          subscriber.add(() => {
            sub.unsubscribe();
            this.removeConnectionSubscriber(instanceId);
          });

          // Start polling all defined metrics
          return this.syncMetricPollers(instanceId);
        })
        .catch((err: Error) => {
          subscriber.next({
            data: { metricId: '', value: null, timestamp: new Date().toISOString(), error: err.message },
          } as MessageEvent);
          subscriber.complete();
        });

      return () => {
        if (connected) {
          this.removeConnectionSubscriber(instanceId);
        }
      };
    });
  }

  /**
   * Ensure a HANA connection exists for the instance. Reuse if already open.
   */
  private async ensureConnection(instanceId: string): Promise<InstanceConnection> {
    const existing = this.connections.get(instanceId);
    if (existing) {
      existing.subscribers++;
      return existing;
    }

    const instance = await this.prisma.hanaInstance.findUnique({
      where: { id: instanceId },
    });
    if (!instance) throw new NotFoundException('Instance not found');

    const client = hdb.createClient({
      host: instance.host,
      port: instance.port,
      user: instance.username,
      password: instance.password,
      useTLS: instance.useSsl,
    });

    return new Promise((resolve, reject) => {
      client.connect((err: Error | null) => {
        if (err) {
          reject(err);
          return;
        }

        const conn: InstanceConnection = {
          client,
          subject: new Subject<MetricResult>(),
          metricPollers: new Map(),
          subscribers: 1,
        };
        this.connections.set(instanceId, conn);
        resolve(conn);
      });
    });
  }

  /**
   * Load all metric definitions and start a poller for each one
   * that doesn't already have one running.
   */
  private async syncMetricPollers(instanceId: string) {
    const conn = this.connections.get(instanceId);
    if (!conn) return;

    const metrics = await this.prisma.metric.findMany({
      where: { showOnDashboard: true },
    });

    for (const metric of metrics) {
      if (conn.metricPollers.has(metric.id)) {
        const poller = conn.metricPollers.get(metric.id)!;
        poller.subscribers++;
        continue;
      }

      const intervalMs = metric.refreshInterval * 1000;

      const poll = () => {
        conn.client.exec(metric.query, (execErr, rows) => {
          if (execErr) {
            conn.subject.next({
              metricId: metric.id,
              value: null,
              timestamp: new Date().toISOString(),
              error: execErr.message,
            });
            return;
          }

          const row = rows?.[0];
          // Get the first column value from the result
          const firstKey = row ? Object.keys(row)[0] : null;
          const value = firstKey ? Number(row[firstKey]) : null;

          conn.subject.next({
            metricId: metric.id,
            value,
            timestamp: new Date().toISOString(),
          });
        });
      };

      poll();
      const timer = setInterval(poll, intervalMs);
      conn.metricPollers.set(metric.id, { timer, subscribers: 1 });
    }
  }

  private removeConnectionSubscriber(instanceId: string) {
    const conn = this.connections.get(instanceId);
    if (!conn) return;

    conn.subscribers--;

    // Decrement metric poller subscribers
    for (const [metricId, poller] of conn.metricPollers) {
      poller.subscribers--;
      if (poller.subscribers <= 0) {
        clearInterval(poller.timer);
        conn.metricPollers.delete(metricId);
      }
    }

    if (conn.subscribers <= 0) {
      this.teardownConnection(instanceId);
    }
  }

  private teardownConnection(instanceId: string) {
    const conn = this.connections.get(instanceId);
    if (!conn) return;

    for (const [, poller] of conn.metricPollers) {
      clearInterval(poller.timer);
    }
    try { conn.client.end(); } catch { /* ignore */ }
    conn.subject.complete();
    this.connections.delete(instanceId);
  }
}
