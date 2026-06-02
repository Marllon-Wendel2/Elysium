import { Room } from 'src/rooms/room.entity';
import { PlayerAction } from './game.types';

export class GameRules {
  // static canExecute(state: any, action: any): boolean {
  //   return true;
  // }

  static isValidSlotChoice(front: number, back: number, max: number): boolean {
    if (!Number.isInteger(front) || !Number.isInteger(back)) return false;
    if (front < 0 || back < 0) return false;

    return front + back === max;
  }

  static resolveAction(
    room: Room,
    actionsPlayerOne: PlayerAction[],
    actionsPlayerTwo: PlayerAction[],
  ) {
    const allSpellUsed = GameRules.buildAction(
      'CAST_SPELL',
      actionsPlayerOne,
      actionsPlayerTwo,
    );

    const evolutonsCard = GameRules.buildAction(
      'EVOLUTION',
      actionsPlayerOne,
      actionsPlayerTwo,
    );

    const allMoveUsed = GameRules.buildAction(
      'MOVE',
      actionsPlayerOne,
      actionsPlayerTwo,
    );

    const allCardDown = GameRules.buildAction(
      'DOWN_CARD',
      actionsPlayerOne,
      actionsPlayerTwo,
    );

    const allAttacksUsed = GameRules.buildAction(
      'ATTACK',
      actionsPlayerOne,
      actionsPlayerTwo,
    );

    GameRules.resolveSpell(room, allSpellUsed);

    GameRules.resolveEvolution(room, evolutonsCard);

    GameRules.resolveMove(room, allMoveUsed);

    GameRules.resolveDownCard(room, allCardDown);

    GameRules.resolveAttack(room, allAttacksUsed);

    GameRules.resolveDead(room);
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

  static resolveSpell(room: Room, allSpellUsed: PlayerAction[]) {
    console.log(allSpellUsed);
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
