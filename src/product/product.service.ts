import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../tools';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async exportProductToExcel(): Promise<Buffer> {
    try {
      const products = await this.prisma.product.findMany();

      if (!products.length) {
        throw new NotFoundException('No products available to export');
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Products');

      worksheet.columns = [
        { header: 'Name (UZ)', key: 'name_uz', width: 20 },
        { header: 'Name (RU)', key: 'name_ru', width: 20 },
        { header: 'Name (EN)', key: 'name_en', width: 20 },
        { header: 'Image URL', key: 'image', width: 40 },
        { header: 'Min Working Hours', key: 'minWorkingHours', width: 20 },
        {
          header: 'Price Hourly',
          key: 'priceHourly',
          width: 15,
          style: { numFmt: '#,##0' },
        },
        {
          header: 'Price Daily',
          key: 'priceDaily',
          width: 15,
          style: { numFmt: '#,##0' },
        },
        { header: 'Quantity', key: 'quantity', width: 15 },
      ];

      products.forEach((product) => {
        worksheet.addRow({
          name_uz: product.name_uz || 'N/A',
          name_ru: product.name_ru || 'N/A',
          name_en: product.name_en || 'N/A',
          image: product.image || 'N/A',
          minWorkingHours: product.minWorkingHours || 0,
          priceHourly: product.priceHourly || 0,
          priceDaily: product.priceDaily || 0,
          quantity: product.quantity || 0,
        });
      });

      const priceColumns = ['priceHourly', 'priceDaily'];
      priceColumns.forEach((col) => {
        worksheet.getColumn(col).numFmt = '#,##0';
      });

      const arrayBuffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Error in exportProductToExcel:', error);
      throw error;
    }
  }

  async create(data: CreateProductDto, userId: string) {
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        name_uz: data.name_uz,
        name_ru: data.name_ru,
        name_en: data.name_en,
      },
    });

    if (existingProduct) {
      throw new BadRequestException('Bu nomli product allaqachon mavjud!');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            name_uz: data.name_uz,
            name_ru: data.name_ru,
            name_en: data.name_en,
            image: data.image,
            quantity: data.quantity,
            minWorkingHours: data.minWorkingHours,
            priceHourly: data.priceHourly,
            priceDaily: data.priceDaily,
            createdBy: userId,
          },
        });

        if (data.productTool?.length) {
          await tx.toolProduct.createMany({
            data: data.productTool.map((tool) => ({
              productId: product.id,
              toolId: tool.toolId,
            })),
          });
        }

        if (data.productLevel?.length) {
          await tx.productLevel.createMany({
            data: data.productLevel.map((level) => ({
              productId: product.id,
              levelId: level.levelId,
            })),
          });
        }

        return product;
      });

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error in create product!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll(query) {
    try {
      const {
        name_uz,
        name_ru,
        name_en,
        priceHourly,
        priceDaily,
        minWorkingHours,
        toolId,
        levelId,
        sortBy = 'name',
        sort = 'asc',
        page = '1',
        limit = '10',
      } = query;

      const where: any = {
        ...(name_uz && { name_uz: { contains: name_uz, mode: 'insensitive' } }),
        ...(name_ru && { name_ru: { contains: name_ru, mode: 'insensitive' } }),
        ...(name_en && { name_en: { contains: name_en, mode: 'insensitive' } }),
        ...(priceHourly && { priceHourly: Number(priceHourly) }),
        ...(priceDaily && { priceDaily: Number(priceDaily) }),
        ...(minWorkingHours && { minWorkingHours: Number(minWorkingHours) }),
        ...(toolId && {
          toolProducts: {
            some: {
              toolId,
            },
          },
        }),
        ...(levelId && {
          productLevels: {
            some: {
              levelId,
            },
          },
        }),
      };

      const sortByFieldMap = {
        name: 'name_uz',
        priceHourly: 'priceHourly',
        priceDaily: 'priceDaily',
        minWorkingHours: 'minWorkingHours',
      };

      const orderByField = sortByFieldMap[sortBy] || 'name_uz';

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const [products, total] = await this.prisma.$transaction([
        this.prisma.product.findMany({
          where,
          orderBy: {
            [orderByField]: sort,
          },
          skip,
          take,
          include: {
            toolProducts: {
              include: {
                Tool: {
                  include: {
                    toolBrands: { include: { brand: true } },
                    toolSizes: { include: { size: true } },
                    toolColors: { include: { Color: true } },
                  },
                },
              },
            },
            productLevels: {
              include: {
                level: true,
              },
            },
          },
        }),
        this.prisma.product.count({ where }),
      ]);

      return {
        data: products,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          lastPage: Math.ceil(total / Number(limit)),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error in get all products!',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async findOne(id: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          toolProducts: {
            include: {
              Tool: {
                include: {
                  toolBrands: {
                    include: {
                      brand: true,
                    },
                  },
                  toolSizes: {
                    include: {
                      size: true,
                    },
                  },
                  toolColors: {
                    include: {
                      Color: true,
                    },
                  },
                },
              },
            },
          },
          productLevels: {
            include: {
              level: true,
            },
          },
        },
      });
      if (!product) {
        throw new InternalServerErrorException('Product topilmadi!');
      }
      return product;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error in get one product!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async update(id: string, data: UpdateProductDto) {
    try {
      const existingProduct = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new NotFoundException('Bunday product topilmadi!');
      }

      const product = await this.prisma.product.update({ where: { id }, data });
      return product;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in update product!', HttpStatus.NOT_FOUND);
    }
  }

  async remove(id: string) {
    try {
      const existingProduct = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new NotFoundException('Bunday product topilmadi!');
      }

      const product = await this.prisma.product.delete({ where: { id } });
      return product;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in delete product!', HttpStatus.NOT_FOUND);
    }
  }
}
