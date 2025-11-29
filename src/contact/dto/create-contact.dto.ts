import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  surName: string;

  @ApiProperty({ example: '+998883334565' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Main St. 123' })
  @IsString()
  address: string;
}
