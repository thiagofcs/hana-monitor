import { IsString, IsNotEmpty, IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  metricId!: string;

  @IsString()
  @IsNotEmpty()
  instanceId!: string;

  @IsInt()
  @Min(5)
  @Max(86400)
  @IsOptional()
  intervalSeconds?: number = 60;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean = true;
}
