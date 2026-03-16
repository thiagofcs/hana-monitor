import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMetricDto } from './dto/create-metric.dto';
import { UpdateMetricDto } from './dto/update-metric.dto';

@Injectable()
export class MetricDefinitionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.metric.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const metric = await this.prisma.metric.findUnique({ where: { id } });
    if (!metric) throw new NotFoundException('Metric not found');
    return metric;
  }

  create(dto: CreateMetricDto) {
    return this.prisma.metric.create({ data: dto });
  }

  async update(id: string, dto: UpdateMetricDto) {
    await this.findOne(id);
    return this.prisma.metric.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.metric.delete({ where: { id } });
  }
}
