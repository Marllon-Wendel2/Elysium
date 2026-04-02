import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GameRules } from './game.rules';
import { RoomsService } from '../rooms/rooms.service';
import {
  BoardSlot,
  PlayerGameView,
  ServerGameState,
  SlotChoice,
} from './game.types';
import { Room } from 'src/rooms/room.entity';
import { DeckService } from 'src/deck/deck.service';
import { PlayersService } from 'src/players/players.service';
import { shuffle } from 'src/helper/shuffle';

@Injectable()
export class GameService {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly deckService: DeckService,
    private readonly playersService: PlayersService,
  ) {}

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
      board: state.board,

      you: {
        hand: me.hand,
        deckCount: me.deck.length,
        victoryPoints: me.victoryPoints,
        totalMana: me.totalMana,
        manaAvailable: me.availableMana,
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
      console.log('phase', room.state.phase);
      return { ok: false, error: 'INVALID_PHASE' };
    }

    const valid = GameRules.isValidSlotChoice(slots.front, slots.back, 10);
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

    if (ready) {
      const choices = room.state.slotChoices;
      room.state.board.slots = this.createBoardFromSlotChoices(
        choices.PLAYERONE!,
        choices.PLAYERTWO!,
      );
      room.state.phase = 'STANDBY';
    }

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

  async startGame(roomId: string) {
    try {
      const room = await this.roomsService.get(roomId);
      if (!room) {
        console.log('room not found');
        return;
      }

      room.state.turn = 1;
      room.state.phase = 'STANDBY';

      const playerOneDeckId = await this.playersService.findDeckById(
        room.players[0].id,
      );
      const playerTwoDeckId = await this.playersService.findDeckById(
        room.players[1].id,
      );

      if (!playerOneDeckId || !playerTwoDeckId) {
        throw new Error('Deck not found');
      }

      const deckOne = await this.deckService.findDeckById(playerOneDeckId);
      const deckTwo = await this.deckService.findDeckById(playerTwoDeckId);

      const deckOneInstance = deckOne.cards.flatMap((c) =>
        Array.from({ length: c.quantity }, () => ({
          instanceId: crypto.randomUUID(),
          cardId: c.cardId,
        })),
      );

      const deckTwoInstance = deckTwo.cards.flatMap((c) =>
        Array.from({ length: c.quantity }, () => ({
          instanceId: crypto.randomUUID(),
          cardId: c.cardId,
        })),
      );

      if (!deckOneInstance.length || !deckTwoInstance.length) {
        throw new Error('Deck vazio');
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      room.state.playerOne.deck = shuffle(deckOneInstance as any);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      room.state.playerTwo.deck = shuffle(deckTwoInstance as any);

      await this.roomsService.updateRoom(room);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Erro ao iniciar o jogo');
    }
  }
}
