import { Injectable, NotFoundException } from '@nestjs/common';
import * as hdb from 'hdb';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { UpdateInstanceDto } from './dto/update-instance.dto';

@Injectable()
export class InstancesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const instances = await this.prisma.hanaInstance.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return instances.map((i) => ({ ...i, password: undefined }));
  }

  async findOne(id: string) {
    const instance = await this.prisma.hanaInstance.findUnique({
      where: { id },
    });
    if (!instance) throw new NotFoundException('Instance not found');
    return { ...instance, password: undefined };
  }

  async create(dto: CreateInstanceDto) {
    const instance = await this.prisma.hanaInstance.create({ data: dto });
    return { ...instance, password: undefined };
  }

  async update(id: string, dto: UpdateInstanceDto) {
    await this.findOne(id);
    const instance = await this.prisma.hanaInstance.update({
      where: { id },
      data: dto,
    });
    return { ...instance, password: undefined };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.hanaInstance.delete({ where: { id } });
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const instance = await this.prisma.hanaInstance.findUnique({
      where: { id },
    });
    if (!instance) throw new NotFoundException('Instance not found');

    return this.tryConnect({
      host: instance.host,
      port: instance.port,
      username: instance.username,
      password: instance.password,
      useSsl: instance.useSsl,
    });
  }

  async tryConnect(params: {
    host: string;
    port: number;
    username: string;
    password: string;
    useSsl: boolean;
  }): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const client = hdb.createClient({
        host: params.host,
        port: params.port,
        user: params.username,
        password: params.password,
        useTLS: params.useSsl,
      });

      const timeout = setTimeout(() => {
        client.end();
        resolve({ success: false, message: 'Connection timed out after 10s' });
      }, 10000);

      client.connect((err: Error | null) => {
        clearTimeout(timeout);
        if (err) {
          resolve({ success: false, message: err.message });
        } else {
          client.end();
          resolve({ success: true, message: 'Connection successful' });
        }
      });
    });
  }
}
