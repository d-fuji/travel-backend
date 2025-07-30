import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TravelGroupsModule } from './travel-groups/travel-groups.module';
import { TravelsModule } from './travels/travels.module';
import { ItineraryModule } from './itinerary/itinerary.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ImagesModule } from './images/images.module';
import { InvitationsModule } from './invitations/invitations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TravelGroupsModule,
    TravelsModule,
    ItineraryModule,
    WishlistModule,
    ExpensesModule,
    ImagesModule,
    InvitationsModule,
  ],
})
export class AppModule {}