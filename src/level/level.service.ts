import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../tools';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { LevelType } from '../generated/prisma/enums';

@Injectable()
export class LevelService {
  constructor(private readonly prisma: PrismaService) {}

  async exportLevelToExcel(): Promise<Buffer> {
    try {
      const levels = await this.prisma.level.findMany();

      if (!levels.length) {
        throw new NotFoundException('No levels available to export');
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Levels');

      worksheet.columns = [
        { header: 'Level Name', key: 'name', width: 20 },
        { header: 'Min Working Hours', key: 'minWorkingHours', width: 20 },
        {
          header: 'Hourly Price',
          key: 'priceHourly',
          width: 15,
          style: { numFmt: '#,##0' },
        },
        {
          header: 'Daily Price',
          key: 'priceDaily',
          width: 15,
          style: { numFmt: '#,##0' },
        },
      ];

      levels.forEach((level) => {
        worksheet.addRow({
          name: level.name || 'N/A',
          minWorkingHours: level.minWorkingHours || 0,
          priceHourly: level.priceHourly || 0,
          priceDaily: level.priceDaily || 0,
        });
      });

      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
      worksheet.autoFilter = 'A1:D1';

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      console.error('Error in exportLevelToExcel:', error);
      throw new InternalServerErrorException('Failed to export levels');
    }
  }

  async create(data: CreateLevelDto) {
    const existingLevel = await this.prisma.level.findFirst({
      where: { name: data.name as LevelType },
    });

    if (existingLevel) {
      throw new InternalServerErrorException('Level already exists!');
    }

    try {
      const level = await this.prisma.level.create({
        data: {
          ...data,
          name: data.name as LevelType,
        },
      });
      return level;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in create level!', HttpStatus.BAD_REQUEST);
    }
  }

  async findAll(query: {
    name?: string;
    sortBy?: 'name' | 'minWorkingHours' | 'priceHourly' | 'priceDaily';
    sort?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        name,
        sortBy = 'name',
        sort = 'asc',
        page = 1,
        limit = 10,
      } = query;

      const where: any = {};

      if (name) {
        where.name = { contains: name, mode: 'insensitive' };
      }

      const levels = await this.prisma.level.findMany({
        where,
        orderBy: {
          [sortBy]: sort,
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await this.prisma.level.count({ where });

      return {
        data: levels,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in get all levels!', HttpStatus.NOT_FOUND);
    }
  }

  async findOne(id: string) {
    try {
      const level = await this.prisma.level.findUnique({
        where: { id },
      });

      if (!level) {
        throw new InternalServerErrorException('Level not found!');
      }

      return level;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in get one level!', HttpStatus.NOT_FOUND);
    }
  }

  async update(id: string, data: UpdateLevelDto) {
    try {
      const level = await this.prisma.level.update({
        where: { id },
        data: {
          ...data,
          name: data.name as LevelType | undefined,
        },
      });

      if (!level) {
        throw new InternalServerErrorException('Level not found!');
      }

      return level;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in update level!', HttpStatus.NOT_FOUND);
    }
  }

  async remove(id: string) {
    try {
      const level = await this.prisma.level.delete({
        where: { id },
      });

      if (!level) {
        throw new InternalServerErrorException('Level not found!');
      }

      return level;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in delete level!', HttpStatus.NOT_FOUND);
    }
  }
}
