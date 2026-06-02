import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { GameRules } from './game.rules';
import { RoomsService } from '../rooms/rooms.service';
import {
  BoardSlot,
  BoardState,
  PlayerAction,
  PlayerGameView,
  PlayerState,
  ServerGameState,
  SlotChoice,
} from './game.types';
import { Server } from 'socket.io';
import { Room } from 'src/rooms/room.entity';
import { DeckService } from 'src/deck/deck.service';
import { PlayersService } from 'src/players/players.service';
import { shuffle } from 'src/helper/shuffle';
import {
  createFirstHand,
  createInstanceOfDeck,
} from 'src/helper/createInstance';
import { effectHandlers } from 'src/effects';

@Injectable()
export class GameService {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly deckService: DeckService,
    private readonly playersService: PlayersService,
  ) {}

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

  async startGame(roomId: string): Promise<Room> {
    try {
      const room = await this.roomsService.get(roomId);

      if (!room) {
        throw new NotFoundException('Room not found');
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

      const deckOneInstance = createInstanceOfDeck(deckOne);
      const deckTwoInstance = createInstanceOfDeck(deckTwo);

      if (!deckOneInstance.length || !deckTwoInstance.length) {
        throw new Error('Deck vazio');
      }

      const deckOneShuffle = shuffle(deckOneInstance);
      const deckTwoShuffle = shuffle(deckTwoInstance);

      const firstHand = createFirstHand(deckOneShuffle);
      const secondHand = createFirstHand(deckTwoShuffle);

      room.state.playerOne.deck = deckOneShuffle;
      room.state.playerTwo.deck = deckTwoShuffle;

      room.state.playerOne.hand = firstHand;
      room.state.playerTwo.hand = secondHand;

      return await this.roomsService.updateRoom(room);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Erro ao iniciar o jogo');
    }
  }

  async emitGameState(server: Server, room: Room) {
    const p1Data = room.players.find((p) => p.player === 'PLAYER ONE');
    const p2Data = room.players.find((p) => p.player === 'PLAYER TWO');

    if (p1Data) {
      const player = await this.playersService.getById(p1Data.id);
      const view = this.createPlayerView(room.state, 'PLAYERONE');
      if (player?.socketId)
        server.to(player.socketId).emit('GAME_SYNC', { state: view });
    }

    if (p2Data) {
      const player = await this.playersService.getById(p2Data.id);
      const view = this.createPlayerView(room.state, 'PLAYERTWO');
      if (player?.socketId)
        server.to(player.socketId).emit('GAME_SYNC', { state: view });
    }
  }

  drawTurn(player: PlayerState) {
    const unit = this.playersService.drawFirstOfType(player, 'UNIT');
    const equip = this.playersService.drawFirstOfType(player, 'EQUIP');

    return {
      unit,
      equip,
    };
  }

  getOrderedSlots(board: BoardState): BoardSlot[] {
    const front = board.slots
      .filter((s) => s.position === 'FRONT')
      .sort((a, b) => b.lane - a.lane);

    const back = board.slots
      .filter((s) => s.position === 'BACK')
      .sort((a, b) => b.lane - a.lane);

    return [...front, ...back];
  }

  resolveStartEffects(state: ServerGameState) {
    const orderedSlots = this.getOrderedSlots(state.board);

    for (const slot of orderedSlots) {
      const card = slot.cardInstance;
      if (!card) continue;

      const abilities = Array.isArray(card.base.ability)
        ? (card.base.ability as Ability[])
        : [];

      for (const ability of abilities) {
        if (ability.trigger === 'START_TURN') {
          this.executeAbility(ability, state, {
            sourceCard: card,
            sourceSlot: slot,
            owner: slot.owner,
          });
        }
      }
    }

    return state;
  }

  executeAbility(
    ability: Ability,
    state: ServerGameState,
    context: EffectContext,
  ) {
    const handler = effectHandlers[ability.effect as EffectKey];

    if (!handler) {
      console.warn('Effect not found:', ability.effect);
      return state;
    }

    return handler(state, context);
  }

  async startRound(server: Server, room: Room) {
    room.state.turn++;

    if (room.state.turn > 1) {
      for (const player of room.players) {
        const { unit, equip } = this.drawTurn(
          player.player === 'PLAYER ONE'
            ? room.state.playerOne
            : room.state.playerTwo,
        );

        server.to(player.id).emit('DRAW_CARDS', {
          unit,
          equip,
        });
      }
    }

    const newGameState = this.resolveStartEffects(room.state);

    room.state = newGameState;

    room.state.phase = 'DECLARATION';
    room.state.pendingActions.PLAYERONE = [];
    room.state.pendingActions.PLAYERTWO = [];

    await this.roomsService.updateRoom(room);

    await this.emitGameState(server, room);
  }

  setActionsByPlayer(room: Room, playerId: string, actions: PlayerAction[]) {
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    const isPlayerOne = player.player === 'PLAYER ONE';

    if (isPlayerOne) {
      room.state.pendingActions.PLAYERONE = actions;
    } else {
      room.state.pendingActions.PLAYERTWO = actions;
    }

    if (
      room.state.pendingActions.PLAYERONE.length > 0 &&
      room.state.pendingActions.PLAYERTWO.length > 0
    ) {
      return { continue: true };
    } else {
      return { continue: false };
    }
  }

  resolveActions(room: Room) {
    console.log('Resolvendo ações');

    return 'continue';
  }

  finishGame(room: Room, mimPointToWin) {
    const playerOnePoint = room.state.playerOne.victoryPoints;
    const playerTwoPoint = room.state.playerTwo.victoryPoints;

    if (playerOnePoint >= mimPointToWin || playerTwoPoint >= mimPointToWin) {
      room.state.winner =
        playerOnePoint > playerTwoPoint ? 'PLAYERONE' : 'PLAYERTWO';
      room.state.phase = 'FINISHED';
      return this.roomsService.updateRoom(room);
    } else {
      room.state.phase = 'DECLARATION';
    }
    return this.roomsService.updateRoom(room);
  }
}
