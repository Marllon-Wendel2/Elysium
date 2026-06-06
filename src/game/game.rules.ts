import { Room } from 'src/rooms/room.entity';
import { BoardState, PlayerAction } from './game.types';
import { effectHandlers } from 'src/effects';
import { RoomsService } from 'src/rooms/rooms.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GameRules {
  constructor(private readonly roomService: RoomsService) {}

  static isValidSlotChoice(front: number, back: number, max: number): boolean {
    if (!Number.isInteger(front) || !Number.isInteger(back)) return false;
    if (front < 0 || back < 0) return false;

    return front + back === max;
  }

  static buildAction(
    type: ActionsType,
    actionsPlayerOne: PlayerAction[],
    actionsPlayerTwo: PlayerAction[],
  ) {
    const allActionPlayerOneByType = actionsPlayerOne.filter(
      (action) => action.type === type,
    );

    const allActionPlayerTwoByType = actionsPlayerTwo.filter(
      (action) => action.type === type,
    );

    const allActionsByType: PlayerAction[] = [];

    const limit = Math.max(
      allActionPlayerOneByType.length,
      allActionPlayerTwoByType.length,
    );

    for (let i = 0; i < limit; i++) {
      allActionsByType.push(allActionPlayerOneByType[i]);
      allActionsByType.push(allActionPlayerTwoByType[i]);
    }

    return allActionsByType;
  }

  async resolveSpell(
    roomId: string,
    allSpellUsed: PlayerAction[],
  ): Promise<boolean> {
    for (const action of allSpellUsed) {
      const room = await this.roomService.get(roomId);

      if (!room) {
        console.log('room não encontrado no resolveSpell');
        return false;
      }

      const handler = effectHandlers[action.abilityKey];

      if (!handler) {
        console.warn(`Effect not found: ${action.abilityKey}`);
        continue;
      }

      await handler(room, {
        sourceCard: action.targetCard || null,
        sourceSlot: action.targetSlot || null,
        owner: action.owner,
      });
    }
    return true;
  }

  static resolveMove(room: Room, allSpellUsed: PlayerAction[]): boolean {
    console.log(allSpellUsed);
    return true;
  }

  async resolveDownCard(
    roomId: string,
    allCardDown: PlayerAction[],
  ): Promise<boolean> {
    for (const action of allCardDown) {
      const room = await this.roomService.get(roomId);

      if (!room) {
        console.log('Room não encontrada no resolve DownCard');
        return false;
      }

      const canDown = GameRules.canDown(action, room.state.board);

      if (canDown) {
        await this.invoceCard(room, action);
      }
    }

    return true;
  }

  static canDown(action: PlayerAction, dashBoard: BoardState): boolean {
    const cardInSlotSelect = dashBoard.slots.find(
      (slot) =>
        slot.lane === action.targetSlot?.lane &&
        slot.owner === action.targetSlot.owner &&
        slot.position === action.targetSlot.position,
    )?.cardInstance;

    if (action.invoqueWay === 'EVOLUTION') {
      return (
        !!cardInSlotSelect &&
        action.cardInstance.base.evolvesFromId === cardInSlotSelect.base.id &&
        action.cardInstance.state.canEvolution
      );
    }

    if (action.invoqueWay === 'NORMAL') {
      return (
        !cardInSlotSelect && action.cardInstance.base.evolvesFromId === null
      );
    }

    return false;
  }

  async invoceCard(room: Room, action: PlayerAction) {
    room.state.board.slots[0].
  }

  static resolveAttack(room: Room, allSpellUsed: PlayerAction[]) {
    console.log(allSpellUsed);
    return 'ok';
  }

  static resolveEvolution(room: Room, allSpellUsed: PlayerAction[]) {
    console.log(allSpellUsed);
    return 'ok';
  }

  static resolveDead(room: Room) {
    return 'ok';
  }
}
