import { IsString, IsNotEmpty, IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class CreateInstanceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  host!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  port?: number = 30015;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsBoolean()
  @IsOptional()
  useSsl?: boolean = false;
}
