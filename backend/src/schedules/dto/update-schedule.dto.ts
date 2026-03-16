import { IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class UpdateScheduleDto {
  @IsInt()
  @Min(5)
  @Max(86400)
  @IsOptional()
  intervalSeconds?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
