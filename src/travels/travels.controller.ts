import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TravelsService } from './travels.service';
import { CreateTravelDto, UpdateTravelDto } from './dto/travels.dto';

@Controller('travels')
@UseGuards(JwtAuthGuard)
export class TravelsController {
  constructor(private readonly travelsService: TravelsService) {}

  @Post()
  create(@Body() createTravelDto: CreateTravelDto, @Request() req) {
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
    return this.travelsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.travelsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTravelDto: UpdateTravelDto) {
    const updateData: any = {};
    
    if (updateTravelDto.name) updateData.name = updateTravelDto.name;
    if (updateTravelDto.destination) updateData.destination = updateTravelDto.destination;
    if (updateTravelDto.startDate) updateData.startDate = new Date(updateTravelDto.startDate);
    if (updateTravelDto.endDate) updateData.endDate = new Date(updateTravelDto.endDate);
    
    return this.travelsService.update(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.travelsService.remove(id);
  }
}