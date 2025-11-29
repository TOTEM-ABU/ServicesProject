import { ApiProperty } from '@nestjs/swagger';
import { LevelType } from '../../generated/prisma/enums';
import { IsEnum, IsNumber, IsString } from 'class-validator';

export class CreateLevelDto {
  @ApiProperty({ enum: LevelType })
  @IsEnum(LevelType)
  @IsString()
  name: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  minWorkingHours: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  priceHourly: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  priceDaily: number;
}
