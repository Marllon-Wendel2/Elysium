import { Room } from 'src/rooms/room.entity';
import { PlayerAction } from './game.types';
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

  async resolveSpell(roomId: string, allSpellUsed: PlayerAction[]) {
    for (const action of allSpellUsed) {
      const room = await this.roomService.get(roomId);

      if (!room) {
        throw new Error('Room not found');
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
    return 'ok';
  }

  static resolveMove(room: Room, allSpellUsed: PlayerAction[]) {
    console.log(allSpellUsed);
    return 'ok';
  }
  static resolveDownCard(room: Room, allSpellUsed: PlayerAction[]) {
    console.log(allSpellUsed);
    return 'ok';
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
