import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulerRunnerService } from './scheduler-runner.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly runner: SchedulerRunnerService,
  ) {}

  @Get()
  findAll() {
    return this.schedulesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateScheduleDto) {
    const result = await this.schedulesService.create(dto);
    await this.runner.syncAll();
    return result;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    const result = await this.schedulesService.update(id, dto);
    await this.runner.syncAll();
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.schedulesService.remove(id);
    await this.runner.syncAll();
  }
}
