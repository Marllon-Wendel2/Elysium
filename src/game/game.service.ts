import { Injectable } from '@nestjs/common';
import { GameRules } from './game.rules';
import { GameReducer } from './game.reducer';
import { GamePresenter } from './game.presenter';
import { RoomsService } from '../rooms/rooms.service';
import { Player } from '../players/player.entity';
import { PlayerGameView, ServerGameState } from './game.types';

@Injectable()
export class GameService {
  constructor(private readonly roomsService: RoomsService) {}

  // processAction(player: Player, action: any) {
  //   const room = this.roomsService.get(player.roomId!);
  //   // if (!room) return;

  //   // if (!GameRules.canExecute(room.state, action)) return;

  //   // room.state = GameReducer.apply(room.state, action);

  //   // for (const p of room.players) {
  //   //   const clientState = GamePresenter.toClientState(room.state, p);
  //   //   // socket emit (iremos ligar depois)
  //   // }
  // }

  createPlayerView(
    state: ServerGameState,
    perspective: 'PLAYERONE' | 'PLAYERTWO',
  ): PlayerGameView {
    const me = perspective === 'PLAYERONE' ? state.playerOne : state.playerTwo;
    const enemy =
      perspective === 'PLAYERONE' ? state.playerTwo : state.playerOne;

    return {
      phase: state.phase,
      currentTurn: state.currentTurn,
      board: state.board,

      you: {
        hand: me.hand,
        deckCount: me.deck.length,
        victoryPoints: me.victoryPoints,
        totalMana: me.totalMana,
        manaAvailable: me.manaAvailable,
      },

      opponent: {
        handCount: enemy.hand.length,
        deckCount: enemy.deck.length,
        victoryPoints: enemy.victoryPoints,
        board: state.board,
      },

      turn: state.turn,
      winner: state.winner,
    };
  }
}
