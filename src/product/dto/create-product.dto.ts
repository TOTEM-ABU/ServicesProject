import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsUrl, ValidateNested } from 'class-validator';
import { ProductToolDto } from './product-tool.dto';
import { Type } from 'class-transformer';
import { ProductLevelDto } from './product-level.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'Santexnik' })
  @IsString()
  name_uz: string;

  @ApiProperty({ example: 'Сантехник' })
  @IsString()
  name_ru: string;

  @ApiProperty({ example: 'Plumber' })
  @IsString()
  name_en: string;

  @ApiProperty({ example: 'https://example.com.png/' })
  @IsString()
  @IsUrl()
  image: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  minWorkingHours: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  priceHourly: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  priceDaily: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ type: [ProductToolDto] })
  @ValidateNested({ each: true })
  @Type(() => ProductToolDto)
  productTool: ProductToolDto[];

  @ApiProperty({ type: [ProductLevelDto] })
  @ValidateNested({ each: true })
  @Type(() => ProductLevelDto)
  productLevel: ProductLevelDto[];
}
