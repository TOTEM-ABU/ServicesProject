import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { CreateGeneralInfoDto } from './dto/create-general-info.dto';
import { UpdateGeneralInfoDto } from './dto/update-general-info.dto';
import { PrismaService } from '../tools';

@Injectable()
export class GeneralInfoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateGeneralInfoDto) {
    const existingInfo = await this.prisma.generalInfo.findFirst({
      where: {
        email: data.email,
      },
    });

    if (existingInfo) {
      throw new BadRequestException('Bu ma`lumot allaqachon mavjud');
    }

    try {
      const info = await this.prisma.generalInfo.create({ data });

      return info;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error in create general-info!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll(query: {
    email?: string;
    phones?: string;
    links?: string;
    sort?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        email = '',
        phones = '',
        links = '',
        sort = 'asc',
        page = 1,
        limit = 10,
      } = query;

      const where: any = {
        email: { contains: email, mode: 'insensitive' },
        phones: { contains: phones, mode: 'insensitive' },
        links: { contains: links, mode: 'insensitive' },
      };

      const items = await this.prisma.generalInfo.findMany({
        where,
        orderBy: { createdAt: sort },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await this.prisma.generalInfo.count({ where });

      return {
        data: items,
        meta: {
          total,
          page,
          limit,
          lastPage: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error in get all general-infos!',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async findOne(id: string) {
    const info = await this.prisma.generalInfo.findUnique({
      where: { id },
    });

    if (!info) {
      throw new BadRequestException('Bunday GeneralInfo topilmadi!');
    }

    try {
      const info = await this.prisma.generalInfo.findUnique({
        where: { id },
      });
      return info;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error in get one general-info!',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async update(id: string, data: UpdateGeneralInfoDto) {
    const existingInfo = await this.prisma.generalInfo.findUnique({
      where: { id },
    });

    if (!existingInfo) {
      throw new BadRequestException('Bunday GeneralInfo topilmadi!');
    }

    try {
      const updatedInfo = await this.prisma.generalInfo.update({
        where: { id },
        data,
      });

      return updatedInfo;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error in update general-info!',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async remove(id: string) {
    const existingInfo = await this.prisma.generalInfo.findUnique({
      where: { id },
    });

    if (!existingInfo) {
      throw new BadRequestException('Bunday GeneralInfo topilmadi!');
    }

    try {
      const deletedInfo = await this.prisma.generalInfo.delete({
        where: { id },
      });

      return deletedInfo;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error in delete general-info!',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
