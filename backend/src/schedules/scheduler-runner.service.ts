import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as hdb from 'hdb';
import { PrismaService } from '../prisma/prisma.service';

interface ScheduleConfig {
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
}

interface RunningSchedule {
  timer: ReturnType<typeof setInterval>;
  client: hdb.Client | null;
  connected: boolean;
  reconnecting: boolean;
  config: ScheduleConfig;
}

const MAX_RECONNECT_DELAY = 60_000;
const INITIAL_RECONNECT_DELAY = 5_000;

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
        this.startSchedule(schedule);
      }
    }

    this.logger.log(`Scheduler synced: ${this.running.size} active schedule(s)`);
  }

  private startSchedule(config: ScheduleConfig) {
    const entry: RunningSchedule = {
      timer: null as unknown as ReturnType<typeof setInterval>,
      client: null,
      connected: false,
      reconnecting: false,
      config,
    };

    this.running.set(config.id, entry);
    this.connect(entry);
  }

  private connect(entry: RunningSchedule) {
    const { config } = entry;

    // Clean up previous client if any
    if (entry.client) {
      try { entry.client.end(); } catch { /* ignore */ }
    }

    const client = hdb.createClient({
      host: config.instance.host,
      port: config.instance.port,
      user: config.instance.username,
      password: config.instance.password,
      useTLS: config.instance.useSsl,
    });

    entry.client = client;
    entry.connected = false;
    entry.reconnecting = false;

    client.connect((err: Error | null) => {
      // Schedule may have been stopped while connecting
      if (!this.running.has(config.id)) {
        try { client.end(); } catch { /* ignore */ }
        return;
      }

      if (err) {
        this.logger.error(`Schedule ${config.id}: connection failed — ${err.message}`);
        this.scheduleReconnect(entry);
        return;
      }

      entry.connected = true;
      this.logger.log(`Schedule ${config.id}: connected to ${config.instance.host}`);

      // Start the collection interval
      const collect = () => this.collect(entry);
      collect();
      entry.timer = setInterval(collect, config.intervalSeconds * 1000);
    });
  }

  private collect(entry: RunningSchedule) {
    const { config, client } = entry;

    if (!client || !entry.connected) return;

    client.exec(config.metric.query, (execErr, rows) => {
      if (execErr) {
        const msg = execErr.message || '';
        if (msg.includes('Connection closed') || msg.includes('disconnected') || msg.includes('ECONNRESET')) {
          this.logger.warn(`Schedule ${config.id}: connection lost — reconnecting`);
          entry.connected = false;
          if (entry.timer) clearInterval(entry.timer);
          this.scheduleReconnect(entry);
          return;
        }
        this.logger.warn(`Schedule ${config.id}: query error — ${msg}`);
        return;
      }

      const row = rows?.[0];
      if (!row) return;

      const value = JSON.parse(JSON.stringify(row));

      this.prisma.metricSnapshot
        .create({
          data: {
            scheduleId: config.id,
            metricId: config.metric.id,
            instanceId: config.instance.id,
            value,
          },
        })
        .catch((e: Error) => {
          this.logger.error(`Schedule ${config.id}: snapshot save failed — ${e.message}`);
        });
    });
  }

  private scheduleReconnect(entry: RunningSchedule, attempt = 0) {
    if (entry.reconnecting) return;
    if (!this.running.has(entry.config.id)) return;

    entry.reconnecting = true;
    const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, attempt), MAX_RECONNECT_DELAY);

    this.logger.log(`Schedule ${entry.config.id}: reconnecting in ${Math.round(delay / 1000)}s`);

    setTimeout(() => {
      if (!this.running.has(entry.config.id)) return;

      entry.reconnecting = false;

      const client = hdb.createClient({
        host: entry.config.instance.host,
        port: entry.config.instance.port,
        user: entry.config.instance.username,
        password: entry.config.instance.password,
        useTLS: entry.config.instance.useSsl,
      });

      // Clean up old client
      if (entry.client) {
        try { entry.client.end(); } catch { /* ignore */ }
      }
      entry.client = client;

      client.connect((err: Error | null) => {
        if (!this.running.has(entry.config.id)) {
          try { client.end(); } catch { /* ignore */ }
          return;
        }

        if (err) {
          this.logger.warn(`Schedule ${entry.config.id}: reconnect failed — ${err.message}`);
          this.scheduleReconnect(entry, attempt + 1);
          return;
        }

        entry.connected = true;
        this.logger.log(`Schedule ${entry.config.id}: reconnected to ${entry.config.instance.host}`);

        const collect = () => this.collect(entry);
        collect();
        entry.timer = setInterval(collect, entry.config.intervalSeconds * 1000);
      });
    }, delay);
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
