import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, HttpCode, HttpStatus, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TravelsService } from './travels.service';
import { CreateTravelDto, UpdateTravelDto } from './dto/travels.dto';

@Controller('travels')
@UseGuards(JwtAuthGuard)
export class TravelsController {
  constructor(private readonly travelsService: TravelsService) { }

  @Post()
  create(@Body() createTravelDto: CreateTravelDto, @Request() req) {
    // ゲストユーザーは旅程を作成できない
    if (req.user.isGuest) {
      throw new ForbiddenException('ゲストユーザーは旅程を作成できません');
    }

    return this.travelsService.create({
      name: createTravelDto.name,
      destination: createTravelDto.destination,
      startDate: new Date(createTravelDto.startDate),
      endDate: new Date(createTravelDto.endDate),
      group: { connect: { id: createTravelDto.groupId } },
      creator: { connect: { id: req.user.userId } },
    });
  }

  @Get()
  findAll(@Request() req) {
    // ゲストユーザーの場合
    if (req.user.isGuest) {
      return this.travelsService.findAll(req.user.userId, true, req.user.groupId);
    }
    
    // 通常ユーザーの場合
    return this.travelsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.travelsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTravelDto: UpdateTravelDto, @Request() req) {
    // ゲストユーザーは旅程を更新できない
    if (req.user.isGuest) {
      throw new ForbiddenException('ゲストユーザーは旅程を更新できません');
    }

    const updateData: any = {};

    if (updateTravelDto.name) updateData.name = updateTravelDto.name;
    if (updateTravelDto.destination) updateData.destination = updateTravelDto.destination;
    if (updateTravelDto.startDate) updateData.startDate = new Date(updateTravelDto.startDate);
    if (updateTravelDto.endDate) updateData.endDate = new Date(updateTravelDto.endDate);

    return this.travelsService.update(id, updateData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req) {
    // ゲストユーザーは旅程を削除できない
    if (req.user.isGuest) {
      throw new ForbiddenException('ゲストユーザーは旅程を削除できません');
    }

    await this.travelsService.remove(id, req.user.userId);
  }
}