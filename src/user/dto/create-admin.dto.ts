import { ApiProperty } from '@nestjs/swagger';
import { RoleType } from '../../generated/prisma/enums';
import {
  IsEmail,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({ example: 'Aziz' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Azizov' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'aziz@gmail.com' })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  @Length(4, 8)
  password: string;

  @ApiProperty({ example: '+998XXXXXXXXX' })
  @IsString()
  @IsPhoneNumber('UZ')
  phoneNumber: string;

  @ApiProperty({ example: 'Main St. 123' })
  @IsString()
  district: string;

  @ApiProperty({
    enum: RoleType,
    example: 'ADMIN/SUPER_ADMIN/VIEWER_ADMIN',
  })
  @IsString()
  role: RoleType;

  @ApiProperty({ example: 'https://example.com.png/' })
  @IsString()
  avatar: string;

  @ApiProperty({ example: "region's (UUID)" })
  @IsString()
  @IsUUID()
  regionId: string;
}
