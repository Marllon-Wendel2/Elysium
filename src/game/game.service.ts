import { Injectable } from '@nestjs/common';
import { GameRules } from './game.rules';
import { GameReducer } from './game.reducer';
import { GamePresenter } from './game.presenter';
import { RoomsService } from '../rooms/rooms.service';
import { Player } from '../players/player.entity';

@Injectable()
export class GameService {
  constructor(private readonly roomsService: RoomsService) {}

  processAction(player: Player, action: any) {
    const room = this.roomsService.get(player.roomId!);
    if (!room) return;

    if (!GameRules.canExecute(room.state, action)) return;

    room.state = GameReducer.apply(room.state, action);

    for (const p of room.players) {
      const clientState = GamePresenter.toClientState(room.state, p.id);
      // socket emit (iremos ligar depois)
    }
  }
}
