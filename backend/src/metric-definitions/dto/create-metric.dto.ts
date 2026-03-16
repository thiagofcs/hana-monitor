import { IsString, IsNotEmpty, IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class CreateMetricDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  query!: string;

  @IsString()
  @IsOptional()
  unit?: string = '';

  @IsInt()
  @Min(1)
  @Max(300)
  @IsOptional()
  refreshInterval?: number = 5;

  @IsString()
  @IsOptional()
  color?: string = 'blue';

  @IsInt()
  @Min(2)
  @Max(12)
  @IsOptional()
  defaultW?: number = 4;

  @IsInt()
  @Min(2)
  @Max(8)
  @IsOptional()
  defaultH?: number = 3;

  @IsBoolean()
  @IsOptional()
  showOnDashboard?: boolean = true;
}
