import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WishlistService } from './wishlist.service';
import { CreateWishlistItemDto, UpdateWishlistItemDto } from './dto/wishlist.dto';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  create(@Body() createWishlistItemDto: CreateWishlistItemDto, @Request() req) {
    return this.wishlistService.create({
      name: createWishlistItemDto.name,
      description: createWishlistItemDto.description,
      isShared: createWishlistItemDto.isShared || false,
      travel: { connect: { id: createWishlistItemDto.travelId } },
      user: { connect: { id: req.user.id } },
    }, req.user.id);
  }

  @Get()
  findByTravel(@Query('travelId') travelId: string) {
    return this.wishlistService.findByTravel(travelId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wishlistService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWishlistItemDto: UpdateWishlistItemDto) {
    return this.wishlistService.update(id, updateWishlistItemDto);
  }

  @Patch(':id/toggle-share')
  toggleShare(@Param('id') id: string) {
    return this.wishlistService.toggleShare(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wishlistService.remove(id);
  }
}