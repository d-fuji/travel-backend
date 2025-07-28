import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TravelGroupsService } from './travel-groups.service';
import { CreateTravelGroupDto, UpdateTravelGroupDto, AddMemberDto } from './dto/travel-groups.dto';

@Controller('travel-groups')
@UseGuards(JwtAuthGuard)
export class TravelGroupsController {
  constructor(private readonly travelGroupsService: TravelGroupsService) {}

  @Post()
  create(@Body() createTravelGroupDto: CreateTravelGroupDto, @Request() req) {
    return this.travelGroupsService.create({
      name: createTravelGroupDto.name,
      creator: { connect: { id: req.user.userId } },
    });
  }

  @Get()
  findAll(@Request() req) {
    return this.travelGroupsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.travelGroupsService.findOne(id);
  }

  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() addMemberDto: AddMemberDto) {
    return this.travelGroupsService.addMember(id, addMemberDto.userId);
  }

  @Delete(':id/members/:userId')
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.travelGroupsService.removeMember(id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTravelGroupDto: UpdateTravelGroupDto) {
    return this.travelGroupsService.update(id, updateTravelGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.travelGroupsService.remove(id);
  }
}