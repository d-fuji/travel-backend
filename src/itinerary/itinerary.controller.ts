import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ItineraryService } from './itinerary.service';
import { CreateItineraryItemDto, UpdateItineraryItemDto } from './dto/itinerary.dto';

@Controller('itinerary')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) { }

  @Post()
  create(@Body() createItineraryItemDto: CreateItineraryItemDto, @Request() req) {
    return this.itineraryService.create({
      title: createItineraryItemDto.title,
      description: createItineraryItemDto.description,
      location: createItineraryItemDto.location,
      locationUrl: createItineraryItemDto.locationUrl,
      startTime: createItineraryItemDto.startTime,
      endTime: createItineraryItemDto.endTime,
      date: createItineraryItemDto.date,
      period: createItineraryItemDto.period,
      travel: { connect: { id: createItineraryItemDto.travelId } },
      creator: { connect: { id: req.user.id } },
    }, req.user.id);
  }

  @Get()
  findByTravel(@Query('travelId') travelId: string) {
    return this.itineraryService.findByTravel(travelId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itineraryService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateItineraryItemDto: UpdateItineraryItemDto) {
    return this.itineraryService.update(id, updateItineraryItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.itineraryService.remove(id);
  }
}