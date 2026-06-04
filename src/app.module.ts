import { Module } from '@nestjs/common';
import { GameGateway } from './gateway/game.gateway';
import { PlayersService } from './players/players.service';
import { RoomsService } from './rooms/rooms.service';
import { GameService } from './game/game.service';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './infra/redis/redis.module';
import { CardsModule } from './cards/cards.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DeckModule } from './deck/deck.module';
import { GameRules } from './game/game.rules';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    CardsModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    DeckModule,
  ],
  providers: [
    GameGateway,
    PlayersService,
    RoomsService,
    GameService,
    GameRules,
  ],
})
export class AppModule {}
