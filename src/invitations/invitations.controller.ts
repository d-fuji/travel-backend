import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationLinkDto, JoinInvitationDto, UpdateInvitationSettingsDto, ConvertGuestDto } from './dto/invitations.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  // Create invitation link
  @UseGuards(JwtAuthGuard)
  @Post('groups/:groupId/invitation-links')
  async createInvitationLink(
    @Param('groupId') groupId: string,
    @Request() req: any,
    @Body() createInvitationLinkDto: CreateInvitationLinkDto,
  ) {
    return this.invitationsService.createInvitationLink(groupId, req.user.id, createInvitationLinkDto);
  }

  // Get group's invitation links
  @UseGuards(JwtAuthGuard)
  @Get('groups/:groupId/invitation-links')
  async getGroupInvitationLinks(
    @Param('groupId') groupId: string,
    @Request() req: any,
  ) {
    return this.invitationsService.getGroupInvitationLinks(groupId, req.user.id);
  }

  // Get invitation details (for joining) - No auth required
  @Get('invitation/:token')
  async getInvitationDetails(@Param('token') token: string) {
    return this.invitationsService.getInvitationDetails(token);
  }

  // Join via invitation link - No auth required initially
  @Post('invitation/:token/join')
  async joinViaInvitation(
    @Param('token') token: string,
    @Body() joinInvitationDto: JoinInvitationDto,
  ) {
    return this.invitationsService.joinViaInvitation(token, joinInvitationDto);
  }

  // Deactivate invitation link
  @UseGuards(JwtAuthGuard)
  @Patch('invitation-links/:linkId/deactivate')
  async deactivateInvitationLink(
    @Param('linkId') linkId: string,
    @Request() req: any,
  ) {
    return this.invitationsService.deactivateInvitationLink(linkId, req.user.id);
  }

  // Delete invitation link
  @UseGuards(JwtAuthGuard)
  @Delete('invitation-links/:linkId')
  async deleteInvitationLink(
    @Param('linkId') linkId: string,
    @Request() req: any,
  ) {
    return this.invitationsService.deleteInvitationLink(linkId, req.user.id);
  }

  // Get invitation link usage history
  @UseGuards(JwtAuthGuard)
  @Get('invitation-links/:linkId/usage')
  async getInvitationUsageHistory(
    @Param('linkId') linkId: string,
    @Request() req: any,
  ) {
    return this.invitationsService.getInvitationUsageHistory(linkId, req.user.id);
  }

  // Get invitation settings
  @UseGuards(JwtAuthGuard)
  @Get('groups/:groupId/invitation-settings')
  async getInvitationSettings(
    @Param('groupId') groupId: string,
    @Request() req: any,
  ) {
    return this.invitationsService.getInvitationSettings(groupId, req.user.id);
  }

  // Update invitation settings
  @UseGuards(JwtAuthGuard)
  @Patch('groups/:groupId/invitation-settings')
  async updateInvitationSettings(
    @Param('groupId') groupId: string,
    @Request() req: any,
    @Body() updateInvitationSettingsDto: UpdateInvitationSettingsDto,
  ) {
    return this.invitationsService.updateInvitationSettings(groupId, req.user.id, updateInvitationSettingsDto);
  }

  // Convert guest user to regular user - No auth required initially
  @Post('guest/:tempId/convert')
  async convertGuestUser(
    @Param('tempId') tempId: string,
    @Body() convertGuestDto: ConvertGuestDto,
  ) {
    return this.invitationsService.convertGuestUser(tempId, convertGuestDto);
  }
}