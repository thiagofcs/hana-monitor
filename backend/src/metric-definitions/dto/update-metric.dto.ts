import { IsString, IsNotEmpty, IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class UpdateMetricDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  query?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsInt()
  @Min(1)
  @Max(300)
  @IsOptional()
  refreshInterval?: number;

  @IsString()
  @IsOptional()
  color?: string;

  @IsInt()
  @Min(2)
  @Max(12)
  @IsOptional()
  defaultW?: number;

  @IsInt()
  @Min(2)
  @Max(8)
  @IsOptional()
  defaultH?: number;

  @IsBoolean()
  @IsOptional()
  showOnDashboard?: boolean;
}
