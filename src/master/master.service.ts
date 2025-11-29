import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateMasterDto } from './dto/create-master.dto';
import { UpdateMasterDto } from './dto/update-master.dto';
import { PrismaService } from '../tools';
import { MarkStarDto } from './dto/master-start.dto';
import * as ExcelJS from 'exceljs';

@Injectable()
export class MasterService {
  constructor(private readonly prisma: PrismaService) {}

  async exportMasterToExcel(): Promise<Buffer> {
    try {
      const masters = await this.prisma.master.findMany();

      if (!masters.length) {
        throw new NotFoundException('No masters available to export');
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Masters');

      worksheet.columns = [
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Phone', key: 'phone', width: 20 },
        {
          header: 'Birth Year',
          key: 'year',
          width: 15,
          style: { numFmt: 'yyyy' },
        },
        { header: 'Experience (years)', key: 'experience', width: 20 },
        { header: 'Image URL', key: 'image', width: 40 },
        { header: 'Passport Image', key: 'passportImage', width: 25 },
        { header: 'About', key: 'about', width: 40 },
      ];

      masters.forEach((master) => {
        worksheet.addRow({
          name: master.name || 'N/A',
          phone: master.phone || 'N/A',
          year: master.year || 'N/A',
          experience: master.experience || 0,
          image: master.image || 'N/A',
          passportImage: master.passportImage || 'N/A',
          about: master.about || 'N/A',
        });
      });

      const arrayBuffer = await workbook.xlsx.writeBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return buffer;
    } catch (error) {
      console.error('Error in exportMasterToExcel:', error);
      throw error;
    }
  }

  async create(data: CreateMasterDto, userId: string) {
    const existing = await this.prisma.master.findUnique({
      where: { phone: data.phone },
    });

    if (existing) {
      throw new BadRequestException('Bu master allaqachon mavjud!');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const master = await tx.master.create({
          data: {
            name: data.name,
            phone: data.phone,
            year: new Date('2000-01-01'),
            experience: data.experience,
            image: data.image,
            passportImage: data.passportImage,
            about: data.about,
            createdBy: userId,
          },
        });

        if (data.masterLevel?.length) {
          await tx.masterLevel.createMany({
            data: data.masterLevel.map((level) => ({
              masterId: master.id,
              levelId: level.levelId,
            })),
          });
        }

        if (data.masterProduct?.length) {
          await tx.masterProduct.createMany({
            data: data.masterProduct.map((product) => ({
              masterId: master.id,
              productId: product.productId,
            })),
          });
        }

        return { message: 'Master yaratildi!' };
      });
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error in create master!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll(query: any) {
    const {
      name,
      phone,
      passportImage,
      year,
      experience,
      levelId,
      productId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = query;

    const skip = (page - 1) * limit;

    try {
      const masters = await this.prisma.master.findMany({
        where: {
          name: name ? { contains: name } : undefined,
          phone: phone ? { contains: phone } : undefined,
          passportImage: passportImage
            ? { contains: passportImage }
            : undefined,
          year: year ? new Date(year) : undefined,
          experience: experience ? Number(experience) : undefined,
          masterLevels: levelId
            ? {
                some: {
                  levelId,
                },
              }
            : undefined,
          masterProducts: productId
            ? {
                some: {
                  productId,
                },
              }
            : undefined,
        },
        include: {
          masterLevels: {
            include: {
              level: true,
            },
          },
          masterProducts: {
            include: {
              Product: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: Number(skip),
        take: Number(limit),
      });

      return masters;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error in get all masters!',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async findOne(id: string) {
    const existingMaster = await this.prisma.master.findUnique({
      where: { id },
    });

    if (!existingMaster) {
      throw new BadRequestException('Bunday master topilmadi');
    }

    try {
      const master = await this.prisma.master.findFirst({
        where: { id },
        include: {
          masterLevels: {
            include: {
              level: true,
            },
          },
          masterProducts: {
            include: {
              Product: true,
            },
          },
        },
      });

      if (!master) {
        throw new InternalServerErrorException('Bunday master topilmadi');
      }

      const stars = await this.prisma.masterStar.findMany({
        where: { masterId: id },
        select: { star: true },
      });

      const avgStar =
        stars.length > 0
          ? stars.reduce((sum, s) => sum + s.star, 0) / stars.length
          : null;

      return {
        ...master,
        avgStar,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in get one master!', HttpStatus.NOT_FOUND);
    }
  }

  async update(id: string, data: UpdateMasterDto) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const master = await tx.master.update({
          where: { id },
          data: {
            name: data.name,
            phone: data.phone,
            year: data.year,
            experience: data.experience,
            image: data.image,
            passportImage: data.passportImage,
            about: data.about,
          },
        });

        if (data.masterLevel?.length) {
          await tx.masterLevel.deleteMany({
            where: { masterId: id },
          });
          await tx.masterLevel.createMany({
            data: data.masterLevel.map((level) => ({
              masterId: master.id,
              levelId: level.levelId,
            })),
          });
        }

        if (data.masterProduct?.length) {
          await tx.masterProduct.deleteMany({
            where: { masterId: id },
          });
          await tx.masterProduct.createMany({
            data: data.masterProduct.map((product) => ({
              masterId: master.id,
              productId: product.productId,
            })),
          });
        }
        return result;
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in update master!', HttpStatus.NOT_FOUND);
    }
  }

  async markStarForMaster(data: MarkStarDto, userId: string) {
    const { masterId, star } = data;

    try {
      const master = await this.prisma.masterStar.create({
        data: {
          masterId,
          star,
          userId: userId,
        },
      });

      if (!master) {
        throw new NotFoundException('Master not found!');
      }

      const allStars = await this.prisma.masterStar.findMany({
        where: { masterId },
        select: { star: true },
      });

      const avgStar =
        allStars.reduce((sum, s) => sum + s.star, 0) / allStars.length;

      await this.prisma.master.update({
        where: { id: masterId },
        data: { star: avgStar },
      });

      return { masterStar: master };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error in mark with start master!',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async remove(id: string) {
    try {
      const result = await this.prisma.master.delete({
        where: { id },
      });

      if (!result) {
        throw new InternalServerErrorException('Bunday master topilmadi');
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in delete master!', HttpStatus.NOT_FOUND);
    }
  }
}
