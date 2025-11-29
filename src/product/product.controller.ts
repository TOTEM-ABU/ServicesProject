import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { RoleType } from '../generated/prisma/enums';
import { Roles, RoleGuard, AuthGuard } from '../tools';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Roles(RoleType.ADMIN)
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createProductDto: CreateProductDto, @Req() req: Request) {
    return this.productService.create(createProductDto, req['user']);
  }

  @Roles(RoleType.ADMIN)
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Get('export-excel')
  async exportExcel(@Res() res: Response) {
    console.log('Export Excel endpoint called for users');
    try {
      const buffer = await this.productService.exportProductToExcel();

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=users_${new Date().toISOString()}.xlsx`,
      );

      console.log('Sending Excel file to client');
      return res.status(HttpStatus.OK).send(buffer);
    } catch (error) {
      console.error('Error in exportExcel:', error);
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).send({
        message: 'Error exporting users to Excel',
        error: error.message,
      });
    }
  }

  @Get()
  @ApiQuery({ name: 'name_uz', required: false, type: String })
  @ApiQuery({ name: 'name_ru', required: false, type: String })
  @ApiQuery({ name: 'name_en', required: false, type: String })
  @ApiQuery({ name: 'priceHourly', required: false, type: Number })
  @ApiQuery({ name: 'priceDaily', required: false, type: Number })
  @ApiQuery({ name: 'minWorkingHours', required: false, type: Number })
  @ApiQuery({ name: 'toolId', required: false, type: String })
  @ApiQuery({ name: 'levelId', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: [
      'name_uz',
      'name_ru',
      'name_en',
      'priceHourly',
      'priceDaily',
      'minWorkingHours',
    ],
  })
  @ApiQuery({ name: 'sort', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('name_uz') name_uz?: string,
    @Query('name_ru') name_ru?: string,
    @Query('name_en') name_en?: string,
    @Query('priceHourly') priceHourly?: number,
    @Query('priceDaily') priceDaily?: number,
    @Query('minWorkingHours') minWorkingHours?: number,
    @Query('toolId') toolId?: string,
    @Query('levelId') levelId?: string,
    @Query('sortBy')
    sortBy: 'name' | 'priceHourly' | 'priceDaily' | 'minWorkingHours' = 'name',
    @Query('sort') sort: 'asc' | 'desc' = 'asc',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.productService.findAll({
      name_uz,
      name_ru,
      name_en,
      priceHourly,
      priceDaily,
      minWorkingHours,
      toolId,
      levelId,
      sortBy,
      sort,
      page,
      limit,
    });
  }

  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Roles(RoleType.ADMIN)
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
