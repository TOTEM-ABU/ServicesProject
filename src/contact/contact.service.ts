import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { PrismaService } from '../tools';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateContactDto) {
    const existingContact = await this.prisma.contact.findFirst({
      where: {
        phone: data.phone,
      },
    });

    if (!existingContact) {
      throw new BadRequestException('Bu telefon contact mavjud');
    }

    try {
      const contact = await this.prisma.contact.create({ data });

      return contact;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error in create contact!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll(query: {
    name?: string;
    surName?: string;
    phone?: string;
    address?: string;
    message?: string;
    sortBy?: 'name' | 'createdAt';
    sort?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        name = '',
        surName = '',
        phone = '',
        address = '',
        message = '',
        sortBy = 'createdAt',
        sort = 'asc',
        page = 1,
        limit = 10,
      } = query;

      const where: any = {
        name: { contains: name, mode: 'insensitive' },
        surName: { contains: surName, mode: 'insensitive' },
        phone: { contains: phone, mode: 'insensitive' },
        address: { contains: address, mode: 'insensitive' },
        message: { contains: message, mode: 'insensitive' },
      };

      const contacts = await this.prisma.contact.findMany({
        where,
        orderBy: { [sortBy]: sort },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await this.prisma.contact.count({ where });

      return {
        data: contacts,
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
        'Error in get all constacts!',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async findOne(id: string) {
    try {
      const contact = await this.prisma.contact.findUnique({ where: { id } });

      if (!contact) {
        throw new HttpException('Contact topilmadi', HttpStatus.NOT_FOUND);
      }

      return contact;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error in get one contact!',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async update(id: string, data: UpdateContactDto) {
    const existingContact = await this.prisma.contact.findUnique({
      where: { id },
    });

    if (!existingContact) {
      throw new HttpException('Contact topilmadi', HttpStatus.NOT_FOUND);
    }

    try {
      const updatedContact = await this.prisma.contact.update({
        where: { id },
        data,
      });

      return updatedContact;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in update contact!', HttpStatus.NOT_FOUND);
    }
  }

  async remove(id: string) {
    const existingContact = await this.prisma.contact.findUnique({
      where: { id },
    });

    if (!existingContact) {
      throw new HttpException('Contact topilmadi', HttpStatus.NOT_FOUND);
    }

    try {
      const updatedContact = await this.prisma.contact.delete({
        where: { id },
      });

      return updatedContact;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error in delete contact!', HttpStatus.NOT_FOUND);
    }
  }
}
