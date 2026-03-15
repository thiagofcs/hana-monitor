import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InstancesService } from './instances.service';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { UpdateInstanceDto } from './dto/update-instance.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('instances')
export class InstancesController {
  constructor(private readonly instancesService: InstancesService) { }

  @Get()
  findAll() {
    return this.instancesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.instancesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateInstanceDto) {
    return this.instancesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInstanceDto) {
    return this.instancesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.instancesService.remove(id);
  }

  @Post(':id/test')
  testConnection(@Param('id') id: string) {
    return this.instancesService.testConnection(id);
  }
}
