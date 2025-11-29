import {
  IsEnum,
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MeasureType } from '../../generated/prisma/enums';
import { OrderProductToolDto } from './product-tool.dto';

export class OrderProductDto {
  @ApiProperty({ example: "product's (UUID)" })
  @IsString()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: "level's (UUID)" })
  @IsString()
  @IsUUID()
  levelId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  count: number;

  @ApiProperty({ enum: MeasureType, example: 'HOUR/DAY' })
  @IsEnum(MeasureType)
  @IsString()
  measure: MeasureType;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  meausureCount: number;

  @ApiProperty({
    type: [OrderProductToolDto],
    description: 'Product bilan birga ishlatiladigan asboblar',
  })
  @ValidateNested({ each: true })
  @Type(() => OrderProductToolDto)
  tools: OrderProductToolDto[];
}
