import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as hdb from 'hdb';
import { PrismaService } from '../prisma/prisma.service';

interface RunningSchedule {
  timer: ReturnType<typeof setInterval>;
  client: hdb.Client | null;
}

@Injectable()
export class SchedulerRunnerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerRunnerService.name);
  private running = new Map<string, RunningSchedule>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.syncAll();
  }

  onModuleDestroy() {
    for (const [id] of this.running) {
      this.stopSchedule(id);
    }
  }

  /**
   * Called on startup and whenever schedules change via API.
   * Loads all enabled schedules, starts new ones, stops removed/disabled ones.
   */
  async syncAll() {
    const schedules = await this.prisma.schedule.findMany({
      where: { enabled: true },
      include: {
        metric: true,
        instance: true,
      },
    });

    const activeIds = new Set(schedules.map((s) => s.id));

    // Stop schedules that are no longer active
    for (const [id] of this.running) {
      if (!activeIds.has(id)) {
        this.stopSchedule(id);
      }
    }

    // Start new schedules
    for (const schedule of schedules) {
      if (!this.running.has(schedule.id)) {
        await this.startSchedule(schedule);
      }
    }

    this.logger.log(`Scheduler synced: ${this.running.size} active schedule(s)`);
  }

  private async startSchedule(schedule: {
    id: string;
    intervalSeconds: number;
    metric: { id: string; query: string };
    instance: {
      id: string;
      host: string;
      port: number;
      username: string;
      password: string;
      useSsl: boolean;
    };
  }) {
    const client = hdb.createClient({
      host: schedule.instance.host,
      port: schedule.instance.port,
      user: schedule.instance.username,
      password: schedule.instance.password,
      useTLS: schedule.instance.useSsl,
    });

    const entry: RunningSchedule = { timer: null as unknown as ReturnType<typeof setInterval>, client };

    client.connect((err: Error | null) => {
      if (err) {
        this.logger.error(`Schedule ${schedule.id}: connection failed — ${err.message}`);
        return;
      }

      const collect = () => {
        client.exec(schedule.metric.query, (execErr, rows) => {
          if (execErr) {
            this.logger.warn(`Schedule ${schedule.id}: query error — ${execErr.message}`);
            return;
          }

          const row = rows?.[0];
          if (!row) return;

          // Store all columns as JSON
          const value = JSON.parse(JSON.stringify(row));

          this.prisma.metricSnapshot
            .create({
              data: {
                scheduleId: schedule.id,
                metricId: schedule.metric.id,
                instanceId: schedule.instance.id,
                value,
              },
            })
            .catch((e: Error) => {
              this.logger.error(`Schedule ${schedule.id}: snapshot save failed — ${e.message}`);
            });
        });
      };

      collect();
      entry.timer = setInterval(collect, schedule.intervalSeconds * 1000);
    });

    this.running.set(schedule.id, entry);
  }

  private stopSchedule(id: string) {
    const entry = this.running.get(id);
    if (!entry) return;

    if (entry.timer) clearInterval(entry.timer);
    if (entry.client) {
      try { entry.client.end(); } catch { /* ignore */ }
    }
    this.running.delete(id);
    this.logger.log(`Schedule ${id} stopped`);
  }
}
