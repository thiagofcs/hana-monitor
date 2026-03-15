import { IsString, IsNotEmpty, IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class UpdateInstanceDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  host?: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  port?: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  username?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  password?: string;

  @IsBoolean()
  @IsOptional()
  useSsl?: boolean;
}
