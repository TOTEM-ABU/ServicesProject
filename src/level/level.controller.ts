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
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { LevelService } from './level.service';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { RoleType } from '../generated/prisma/enums';
import { Roles, RoleGuard, AuthGuard } from '../tools';

@Controller('level')
export class LevelController {
  constructor(private readonly levelService: LevelService) {}

  @Roles(RoleType.ADMIN)
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createLevelDto: CreateLevelDto) {
    return this.levelService.create(createLevelDto);
  }

  @Roles(RoleType.ADMIN)
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Get('export-excel')
  async exportExcel(@Res() res: Response) {
    console.log('Export Excel endpoint called for users');
    try {
      const buffer = await this.levelService.exportLevelToExcel();

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
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['name', 'minWorkingHours', 'priceHourly', 'priceDaily'],
  })
  @ApiQuery({ name: 'sort', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('name') name?: string,
    @Query('sortBy')
    sortBy: 'name' | 'minWorkingHours' | 'priceHourly' | 'priceDaily' = 'name',
    @Query('sort') sort: 'asc' | 'desc' = 'asc',
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.levelService.findAll({
      name,
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
    return this.levelService.findOne(id);
  }

  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLevelDto: UpdateLevelDto) {
    return this.levelService.update(id, updateLevelDto);
  }

  @Roles(RoleType.ADMIN)
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.levelService.remove(id);
  }
}
