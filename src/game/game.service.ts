import { Injectable } from '@nestjs/common';
import { GameRules } from './game.rules';
import { RoomsService } from '../rooms/rooms.service';
import {
  BoardSlot,
  PlayerGameView,
  ServerGameState,
  SlotChoice,
} from './game.types';
import { Room } from 'src/rooms/room.entity';

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

  async submitSlotChoice(
    room: Room,
    playerId: string,
    slots: { front: number; back: number },
  ): Promise<{ ok: boolean; ready?: boolean; error?: string }> {
    if (room.state.phase !== 'SETUP') {
      return { ok: false, error: 'INVALID_PHASE' };
    }

    const valid = GameRules.isValidSlotChoice(slots.front, slots.back, 5);
    if (!valid) {
      return { ok: false, error: 'INVALID_SLOT_CHOICE' };
    }

    const side =
      room.players.find((p) => p.id === playerId)?.player === 'PLAYER ONE'
        ? 'PLAYERONE'
        : 'PLAYERTWO';

    room.state.slotChoices ??= {};
    room.state.slotChoices[side] = slots;

    const ready =
      room.state.slotChoices.PLAYERONE && room.state.slotChoices.PLAYERTWO;

    const choices = room.state.slotChoices;

    if (!choices?.PLAYERONE || !choices?.PLAYERTWO) {
      return { ok: false, error: 'SLOT_CHOICES_INCOMPLETE' };
    }

    room.state.board.slots = this.createBoardFromSlotChoices(
      choices.PLAYERONE,
      choices.PLAYERTWO,
    );

    await this.roomsService.updateRoom(room);

    return { ok: true, ready: Boolean(ready) };
  }

  createBoardFromSlotChoices(p1: SlotChoice, p2: SlotChoice): BoardSlot[] {
    const slots: BoardSlot[] = [];

    for (let i = 0; i < p1.front; i++) {
      slots.push({
        lane: i,
        position: 'FRONT',
        owner: 'PLAYERONE',
      });
    }

    for (let i = 0; i < p1.back; i++) {
      slots.push({
        lane: i,
        position: 'BACK',
        owner: 'PLAYERONE',
      });
    }

    for (let i = 0; i < p2.front; i++) {
      slots.push({
        lane: i,
        position: 'FRONT',
        owner: 'PLAYERTWO',
      });
    }

    for (let i = 0; i < p2.back; i++) {
      slots.push({
        lane: i,
        position: 'BACK',
        owner: 'PLAYERTWO',
      });
    }

    return slots;
  }
}
