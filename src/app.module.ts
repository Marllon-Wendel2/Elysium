import { Module } from '@nestjs/common';
import { GameGateway } from './gateway/game.gateway';
import { PlayersService } from './players/players.service';
import { RoomsService } from './rooms/rooms.service';
import { GameService } from './game/game.service';

@Module({
  providers: [GameGateway, PlayersService, RoomsService, GameService],
})
export class AppModule {}
