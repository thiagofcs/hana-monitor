import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.schedule.findMany({
      include: {
        metric: { select: { id: true, name: true, unit: true } },
        instance: { select: { id: true, name: true, host: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        metric: { select: { id: true, name: true, unit: true } },
        instance: { select: { id: true, name: true, host: true } },
      },
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return schedule;
  }

  async create(dto: CreateScheduleDto) {
    // Verify metric and instance exist
    const metric = await this.prisma.metric.findUnique({ where: { id: dto.metricId } });
    if (!metric) throw new NotFoundException('Metric not found');
    const instance = await this.prisma.hanaInstance.findUnique({ where: { id: dto.instanceId } });
    if (!instance) throw new NotFoundException('Instance not found');

    return this.prisma.schedule.create({
      data: dto,
      include: {
        metric: { select: { id: true, name: true, unit: true } },
        instance: { select: { id: true, name: true, host: true } },
      },
    });
  }

  async update(id: string, dto: UpdateScheduleDto) {
    await this.findOne(id);
    return this.prisma.schedule.update({
      where: { id },
      data: dto,
      include: {
        metric: { select: { id: true, name: true, unit: true } },
        instance: { select: { id: true, name: true, host: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.schedule.delete({ where: { id } });
  }
}
