import { Module } from '@nestjs/common';
import { GameGateway } from './gateway/game.gateway';
import { PlayersService } from './players/players.service';
import { RoomsService } from './rooms/rooms.service';
import { GameService } from './game/game.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './infra/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    MongooseModule.forRoot(process.env.MONGO_STRING as string),
  ],
  providers: [GameGateway, PlayersService, RoomsService, GameService],
})
export class AppModule {}
