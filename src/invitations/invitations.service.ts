import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvitationLinkDto, JoinInvitationDto, UpdateInvitationSettingsDto, ConvertGuestDto } from './dto/invitations.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  // Generate secure random token
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create invitation link
  async createInvitationLink(groupId: string, userId: string, createInvitationLinkDto: CreateInvitationLinkDto) {
    // Check if user has permission to create invitation links
    const groupMember = await this.prisma.travelGroupMember.findFirst({
      where: { groupId, userId },
      include: { group: true }
    });

    if (!groupMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Check invitation settings
    const settings = await this.prisma.invitationSettings.findUnique({
      where: { groupId }
    });

    // If settings exist and allowMemberInvite is false, only creator can create links
    if (settings && !settings.allowMemberInvite && groupMember.group.createdBy !== userId) {
      throw new ForbiddenException('Only group creator can create invitation links');
    }

    const token = this.generateSecureToken();

    const invitationLink = await this.prisma.invitationLink.create({
      data: {
        groupId,
        token,
        createdBy: userId,
        customMessage: createInvitationLinkDto.customMessage,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    return invitationLink;
  }

  // Get group's invitation links
  async getGroupInvitationLinks(groupId: string, userId: string) {
    // Check if user is member of the group
    const groupMember = await this.prisma.travelGroupMember.findFirst({
      where: { groupId, userId }
    });

    if (!groupMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const invitationLinks = await this.prisma.invitationLink.findMany({
      where: { groupId },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        _count: {
          select: { usages: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return invitationLinks;
  }

  // Get invitation details (for joining)
  async getInvitationDetails(token: string) {
    const invitationLink = await this.prisma.invitationLink.findUnique({
      where: { token },
      include: {
        group: {
          include: {
            creator: {
              select: { id: true, name: true, email: true, avatar: true }
            },
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatar: true }
                }
              }
            },
            travels: {
              select: { id: true, name: true, destination: true, startDate: true, endDate: true }
            }
          }
        },
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    if (!invitationLink) {
      throw new NotFoundException('Invitation link not found');
    }

    if (!invitationLink.isActive) {
      throw new BadRequestException('Invitation link is no longer active');
    }

    return {
      token: invitationLink.token,
      group: invitationLink.group,
      travels: invitationLink.group.travels,
      inviter: invitationLink.creator,
      customMessage: invitationLink.customMessage,
      memberCount: invitationLink.group.members.length,
      isValid: true
    };
  }

  // Join via invitation link
  async joinViaInvitation(token: string, joinInvitationDto: JoinInvitationDto) {
    const invitationLink = await this.prisma.invitationLink.findUnique({
      where: { token },
      include: {
        group: {
          include: {
            invitationSettings: true
          }
        }
      }
    });

    if (!invitationLink) {
      throw new NotFoundException('Invitation link not found');
    }

    if (!invitationLink.isActive) {
      throw new BadRequestException('Invitation link is no longer active');
    }

    let userId: string;
    let isNewUser = false;

    // Handle different join scenarios
    if (joinInvitationDto.userId) {
      // Existing user joining
      userId = joinInvitationDto.userId;
      
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      // Check if user is already a member
      const existingMember = await this.prisma.travelGroupMember.findFirst({
        where: { groupId: invitationLink.groupId, userId }
      });

      if (existingMember) {
        throw new BadRequestException('User is already a member of this group');
      }

    } else if (joinInvitationDto.userData) {
      // New user registration
      const hashedPassword = await bcrypt.hash(joinInvitationDto.userData.password, 10);
      
      // Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: joinInvitationDto.userData.email }
      });

      if (existingUser) {
        throw new BadRequestException('Email already registered');
      }

      const newUser = await this.prisma.user.create({
        data: {
          email: joinInvitationDto.userData.email,
          password: hashedPassword,  
          name: joinInvitationDto.userData.name,
        }
      });

      userId = newUser.id;
      isNewUser = true;

    } else if (joinInvitationDto.guestData) {
      // Guest user joining
      if (!invitationLink.group.invitationSettings?.allowGuestMode) {
        throw new BadRequestException('Guest mode is not allowed for this group');
      }

      const guestUser = await this.prisma.guestUser.create({
        data: {
          tempId: crypto.randomUUID(),
          nickname: joinInvitationDto.guestData.nickname,
          groupId: invitationLink.groupId,
          deviceFingerprint: joinInvitationDto.guestData.deviceFingerprint,
          permissions: {
            create: [
              { action: 'read', allowed: true },
              { action: 'comment', allowed: true },
              { action: 'edit_wishlist', allowed: false }
            ]
          }
        },
        include: {
          permissions: true
        }
      });

      // Note: We don't record usage for guest users since they don't have a real user ID
      // Guest user tracking is handled through the guestUser table itself

      return {
        success: true,
        guestUserId: guestUser.tempId,
        message: 'Successfully joined as guest'
      };

    } else {
      throw new BadRequestException('Invalid join request data');
    }

    // Add user to group
    await this.prisma.travelGroupMember.create({
      data: {
        groupId: invitationLink.groupId,
        userId
      }
    });

    // Record usage
    await this.prisma.invitationUsage.create({
      data: {
        invitationLinkId: invitationLink.id,
        userId,
        success: true
      }
    });

    return {
      success: true,
      userId,
      isNewUser,
      message: 'Successfully joined the group'
    };
  }

  // Deactivate invitation link
  async deactivateInvitationLink(linkId: string, userId: string) {
    const invitationLink = await this.prisma.invitationLink.findUnique({
      where: { id: linkId },
      include: { group: true }
    });

    if (!invitationLink) {
      throw new NotFoundException('Invitation link not found');
    }

    // Check if user has permission to deactivate
    const groupMember = await this.prisma.travelGroupMember.findFirst({
      where: { groupId: invitationLink.groupId, userId }
    });

    if (!groupMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Only creator or group creator can deactivate
    if (invitationLink.createdBy !== userId && invitationLink.group.createdBy !== userId) {
      throw new ForbiddenException('You can only deactivate your own invitation links');
    }

    await this.prisma.invitationLink.update({
      where: { id: linkId },
      data: { isActive: false }
    });
  }

  // Delete invitation link
  async deleteInvitationLink(linkId: string, userId: string) {
    const invitationLink = await this.prisma.invitationLink.findUnique({
      where: { id: linkId },
      include: { group: true }
    });

    if (!invitationLink) {
      throw new NotFoundException('Invitation link not found');
    }

    // Check if user has permission to delete
    const groupMember = await this.prisma.travelGroupMember.findFirst({
      where: { groupId: invitationLink.groupId, userId }
    });

    if (!groupMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Only creator or group creator can delete
    if (invitationLink.createdBy !== userId && invitationLink.group.createdBy !== userId) {
      throw new ForbiddenException('You can only delete your own invitation links');
    }

    await this.prisma.invitationLink.delete({
      where: { id: linkId }
    });
  }

  // Get invitation link usage history
  async getInvitationUsageHistory(linkId: string, userId: string) {
    const invitationLink = await this.prisma.invitationLink.findUnique({
      where: { id: linkId },
      include: { group: true }
    });

    if (!invitationLink) {
      throw new NotFoundException('Invitation link not found');
    }

    // Check if user has permission to view usage
    const groupMember = await this.prisma.travelGroupMember.findFirst({
      where: { groupId: invitationLink.groupId, userId }
    });

    if (!groupMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const usageHistory = await this.prisma.invitationUsage.findMany({
      where: { invitationLinkId: linkId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      },
      orderBy: { usedAt: 'desc' }
    });

    return usageHistory;
  }

  // Get invitation settings
  async getInvitationSettings(groupId: string, userId: string) {
    // Check if user is member of the group
    const groupMember = await this.prisma.travelGroupMember.findFirst({
      where: { groupId, userId }
    });

    if (!groupMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    let settings = await this.prisma.invitationSettings.findUnique({
      where: { groupId }
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await this.prisma.invitationSettings.create({
        data: {
          groupId,
          allowMemberInvite: false,
          requireApproval: false,
          allowGuestMode: true
        }
      });
    }

    return settings;
  }

  // Update invitation settings
  async updateInvitationSettings(groupId: string, userId: string, updateInvitationSettingsDto: UpdateInvitationSettingsDto) {
    // Check if user is group creator
    const group = await this.prisma.travelGroup.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.createdBy !== userId) {
      throw new ForbiddenException('Only group creator can update invitation settings');
    }

    const settings = await this.prisma.invitationSettings.upsert({
      where: { groupId },
      update: updateInvitationSettingsDto,
      create: {
        groupId,
        allowMemberInvite: updateInvitationSettingsDto.allowMemberInvite ?? false,
        requireApproval: updateInvitationSettingsDto.requireApproval ?? false,
        allowGuestMode: updateInvitationSettingsDto.allowGuestMode ?? true
      }
    });

    return settings;
  }

  // Convert guest to regular user
  async convertGuestUser(tempId: string, convertGuestDto: ConvertGuestDto) {
    const guestUser = await this.prisma.guestUser.findUnique({
      where: { tempId },
      include: { permissions: true }
    });

    if (!guestUser) {
      throw new NotFoundException('Guest user not found');
    }

    if (guestUser.isConverted) {
      throw new BadRequestException('Guest user has already been converted');
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: convertGuestDto.email }
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(convertGuestDto.password, 10);

    // Create regular user
    const newUser = await this.prisma.user.create({
      data: {
        email: convertGuestDto.email,
        password: hashedPassword,
        name: convertGuestDto.name || guestUser.nickname,
      }
    });

    // Add user to group
    await this.prisma.travelGroupMember.create({
      data: {
        groupId: guestUser.groupId,
        userId: newUser.id
      }
    });

    // Update guest user record
    await this.prisma.guestUser.update({
      where: { tempId },
      data: {
        isConverted: true,
        convertedUserId: newUser.id
      }
    });

    return {
      success: true,
      userId: newUser.id,
      message: 'Successfully converted to regular user'
    };
  }
}