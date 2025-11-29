import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../tools';
import { MeasureType, StatusType } from '../generated/prisma/enums';
import { AddMastersToOrderDto } from './dto/add-masters.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto, userId: string) {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const createdOrder = await prisma.order.create({
          data: {
            lat: dto.lat,
            long: dto.long,
            address: dto.address,
            date: new Date(dto.date),
            paymentType: dto.paymentType,
            withDelivery: dto.withDelivery,
            commentToDelivery: dto.commentToDelivery,
            userId,
            total: 0,
            status: StatusType.PENDING,
          },
        });

        let subtotal = 0;
        let deliveryFee = 0;
        const taxRate = 0.1;
        let discount = 0;

        if (dto.withDelivery) {
          deliveryFee = 10;
        }

        for (const orderProduct of dto.orderProducts) {
          const [product, level] = await Promise.all([
            prisma.product.findUnique({
              where: { id: orderProduct.productId },
            }),
            prisma.level.findUnique({ where: { id: orderProduct.levelId } }),
          ]);

          if (!product) throw new NotFoundException('Product topilmadi!');
          if (!level) throw new NotFoundException('Daraja topilmadi!');
          if (product.quantity < orderProduct.count) {
            throw new BadRequestException('Product miqdori yetarli emas!');
          }

          const productPrice =
            orderProduct.measure === MeasureType.HOUR
              ? product.priceHourly * orderProduct.meausureCount
              : product.priceDaily * orderProduct.meausureCount;

          const levelPrice =
            orderProduct.measure === MeasureType.HOUR
              ? level.priceHourly * orderProduct.meausureCount
              : level.priceDaily * orderProduct.meausureCount;

          const finalPrice = productPrice + levelPrice;
          const productSubtotal = finalPrice * orderProduct.count;
          subtotal += productSubtotal;

          await prisma.product.update({
            where: { id: product.id },
            data: {
              quantity: product.quantity - orderProduct.count,
              isActive: product.quantity - orderProduct.count > 0,
            },
          });

          await prisma.orderProduct.create({
            data: {
              orderId: createdOrder.id,
              productId: orderProduct.productId,
              levelId: orderProduct.levelId,
              count: orderProduct.count,
              measure: orderProduct.measure,
              price: finalPrice,
            },
          });

          if (orderProduct.tools?.length) {
            for (const tool of orderProduct.tools) {
              const toolRecord = await prisma.tool.findUnique({
                where: { id: tool.toolId },
              });

              if (!toolRecord) throw new NotFoundException('Asbob topilmadi!');
              if (toolRecord.quantity < tool.count) {
                throw new BadRequestException('Asbob miqdori yetarli emas!');
              }

              const toolPrice =
                toolRecord.price * orderProduct.meausureCount * 0.5;
              subtotal += toolPrice * tool.count;

              await prisma.orderProductTool.create({
                data: {
                  orderId: createdOrder.id,
                  productId: orderProduct.productId,
                  toolId: tool.toolId,
                  count: tool.count,
                  meausureCount: orderProduct.meausureCount,
                },
              });
            }
          }
        }

        if (dto.orderTools?.length) {
          for (const orderTool of dto.orderTools) {
            const tool = await prisma.tool.findUnique({
              where: { id: orderTool.toolId },
            });

            if (!tool) throw new NotFoundException('Asbob topilmadi!');
            if (tool.quantity < orderTool.count) {
              throw new BadRequestException('Asbob miqdori yetarli emas!');
            }

            const toolPrice = tool.price * 1;
            subtotal += toolPrice * orderTool.count;

            await prisma.tool.update({
              where: { id: tool.id },
              data: {
                quantity: tool.quantity - orderTool.count,
                isActive: tool.quantity - orderTool.count > 0,
              },
            });

            await prisma.orderTool.create({
              data: {
                orderId: createdOrder.id,
                toolId: tool.id,
                count: orderTool.count,
              },
            });
          }
        }

        if (dto.promoCode) {
          discount += subtotal * 0.1;
        }
        if (subtotal > 100) {
          discount += subtotal * 0.05;
        }

        const tax = subtotal * taxRate;

        const total = subtotal + deliveryFee + tax - discount;

        const updatedOrder = await prisma.order.update({
          where: { id: createdOrder.id },
          data: { total },
          include: {
            orderProducts: {
              include: {
                Product: true,
                Level: true,
                tools: { include: { Tool: true } },
              },
            },
            orderTools: { include: { Tool: true } },
            masters: true,
            comments: true,
          },
        });

        return updatedOrder;
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Order yaratishda xatolik: ' + error.message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async addMastersToOrder(dto: AddMastersToOrderDto) {
    try {
      const { orderId, masterIds } = dto;
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundException('Order topilmadi!');
      }

      const foundMasters = await this.prisma.master.findMany({
        where: {
          id: { in: masterIds },
        },
      });

      if (foundMasters.length !== masterIds.length) {
        throw new BadRequestException('Baʼzi masterlar topilmadi!');
      }

      const orderMasters = masterIds.map((masterId) => ({
        orderId,
        masterId,
      }));

      await this.prisma.orderMaster.createMany({
        data: orderMasters,
      });

      await this.prisma.master.updateMany({
        where: {
          id: { in: masterIds },
        },
        data: {
          isActive: true,
        },
      });

      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: StatusType.IN_PROGRESS },
      });

      return { message: 'Masterlar muvaffaqiyatli biriktirildi!' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error in add masters to order!',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async findAll(query: any) {
    try {
      const {
        total,
        lat,
        long,
        address,
        date,
        paymentType,
        withDelivery,
        status,
        toolId,
        productId,
        masterId,
        sort,
        page = 1,
        limit = 10,
      } = query;

      const where: any = {};

      if (total !== undefined) where.total = total;
      if (lat !== undefined) where.lat = lat;
      if (long !== undefined) where.long = long;
      if (address !== undefined)
        where.address = { contains: address, mode: 'insensitive' };
      if (date !== undefined) where.date = new Date(date);
      if (paymentType !== undefined) where.paymentType = paymentType;
      if (withDelivery !== undefined) where.withDelivery = withDelivery;
      if (status !== undefined) where.status = status;

      if (toolId && toolId.length > 0) {
        where.orderTools = {
          some: {
            toolId: { in: toolId },
          },
        };
      }

      if (productId && productId.length > 0) {
        where.orderProducts = {
          some: {
            productId: { in: productId },
          },
        };
      }

      if (masterId && masterId.length > 0) {
        where.masters = {
          some: {
            masterId: { in: masterId },
          },
        };
      }

      let orderBy = {};
      if (sort) {
        const [field, order] = sort.split(':');
        orderBy = {
          [field]: order,
        };
      } else {
        orderBy = { date: 'desc' };
      }

      const skip = (page - 1) * limit;

      const orders = await this.prisma.order.findMany({
        where,
        include: {
          orderTools: { include: { Tool: true } },
          orderProducts: { include: { Product: true, Level: true } },
          masters: { include: { Master: true } },
          comments: true,
        },
        orderBy,
        skip,
        take: limit,
      });

      return orders;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in get all orders!', HttpStatus.NOT_FOUND);
    }
  }

  async findOne(id: string) {
    const orderexists = await this.prisma.order.findFirst({
      where: { id },
      include: {
        orderTools: {
          include: {
            Tool: true,
          },
        },
        orderProducts: {
          include: {
            Product: true,
          },
        },
        masters: {
          include: {
            Master: true,
          },
        },
        comments: true,
      },
    });

    if (!orderexists) {
      throw new BadRequestException('Order not found');
    }

    try {
      const order = await this.prisma.order.findFirst({ where: { id } });
      return order;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in get one order!', HttpStatus.NOT_FOUND);
    }
  }

  async update(id: string, data: UpdateOrderDto) {
    const orderexists = await this.prisma.order.findFirst({ where: { id } });

    if (!orderexists) {
      throw new BadRequestException('Order not found');
    }

    const { orderTools, orderProducts, ...updateData } = data;

    try {
      const update = await this.prisma.order.update({
        where: { id },
        data: updateData,
      });
      return update;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in update order!', HttpStatus.NOT_FOUND);
    }
  }

  async remove(id: string) {
    const orderexists = await this.prisma.order.findFirst({ where: { id } });

    if (!orderexists) {
      throw new BadRequestException('Order not found');
    }
    try {
      const order = await this.prisma.order.delete({ where: { id } });
      return order;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in delete order!', HttpStatus.NOT_FOUND);
    }
  }
}
