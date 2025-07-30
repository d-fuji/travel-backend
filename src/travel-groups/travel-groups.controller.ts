import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TravelGroupsService } from './travel-groups.service';
import { CreateTravelGroupDto, UpdateTravelGroupDto, AddMemberDto } from './dto/travel-groups.dto';

@Controller('travel-groups')
@UseGuards(JwtAuthGuard)
export class TravelGroupsController {
  constructor(private readonly travelGroupsService: TravelGroupsService) { }

  @Post()
  create(@Body() createTravelGroupDto: CreateTravelGroupDto, @Request() req) {
    return this.travelGroupsService.create({
      name: createTravelGroupDto.name,
      creator: { connect: { id: req.user.userId } },
    });
  }

  @Get()
  findAll(@Request() req) {
    // ゲストユーザーの場合
    if (req.user.isGuest) {
      return this.travelGroupsService.findAll(req.user.userId, true, req.user.groupId);
    }
    
    // 通常ユーザーの場合
    return this.travelGroupsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.travelGroupsService.findOne(id);
  }

  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() addMemberDto: AddMemberDto, @Request() req) {
    return this.travelGroupsService.addMember(id, addMemberDto.email, req.user.userId);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(@Param('id') id: string, @Param('userId') userId: string, @Request() req) {
    return this.travelGroupsService.removeMember(id, userId, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTravelGroupDto: UpdateTravelGroupDto, @Request() req) {
    return this.travelGroupsService.update(id, updateTravelGroupDto, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Request() req) {
    await this.travelGroupsService.remove(id, req.user.userId);
  }
}