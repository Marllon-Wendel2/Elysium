import { Room } from 'src/rooms/room.entity';
import { BoardSlot, BoardState, PlayerAction } from './game.types';
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
    console.log('entrou no resolve Down Card');
    for (const action of allCardDown) {
      const room = await this.roomService.get(roomId);
      console.log('entrou no for do down card');

      if (!room) {
        console.log('Room não encontrada no resolve DownCard');
        return false;
      }

      const canDown = GameRules.canDown(action, room.state.board);

      if (canDown) {
        console.log(`Pode baixar ${canDown}`);
        await this.invoceCard(room, action);
      } else {
        console.log(`Não pode baixar`);
      }
    }

    return true;
  }

  static canDown(action: PlayerAction, dashBoard: BoardState): boolean {
    console.log('verificando se pode baixar');
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
    console.log('entrou no target slot');
    if (!action.targetSlot) {
      return {
        success: false,
        message: 'Esta ação requer um slot alvo',
      };
    }

    //buscar carta da mao
    const playerState =
      action.owner === 'PLAYERONE'
        ? room.state.playerOne
        : room.state.playerTwo;
    const playerHand = playerState.hand;

    const indexOfInstanceCard = playerHand.findIndex((cardIntance) => {
      return cardIntance.instanceId === action.cardInstance.instanceId;
    });

    if (indexOfInstanceCard === -1) {
      throw new Error(
        `Card with instanceId ${action.cardInstance.instanceId} not found in player's hand`,
      );
    }

    // tirar da mao
    const [cardRemoved] = playerHand.splice(indexOfInstanceCard, 1);

    /// Verificar se o slot pode receber essa carta
    const canInvoke: boolean = GameRules.validateSlotForCard(
      action,
      action.targetSlot,
      cardRemoved,
    );

    if (!canInvoke) {
      return {
        success: false,
        message: 'Essa carta não pode ser invocada',
      };
    }

    const boardSlot: BoardSlot = {
      lane: action.targetSlot.lane,
      position: action.targetSlot.position,
      owner: action.owner,
      cardInstance: cardRemoved,
    };

    //atualiza room hand and slot
    await this.roomService.updateHand(room.id, action.owner, playerHand);
    await this.roomService.updateSlot(room.id, boardSlot);
  }

  static validateSlotForCard(
    action: PlayerAction,
    slotTarget: BoardSlot,
    cardRemoved: CardInstance,
  ): boolean {
    //se for evolucao verificar se a carta evolui da carta no board
    if (action.invoqueWay === 'EVOLUTION') {
      const canEvolution =
        slotTarget.cardInstance?.base.id === cardRemoved.base.evolvesFromId
          ? true
          : false;

      return canEvolution;
    }

    //se for baixar carta verificar se o slot está vazio
    if (action.invoqueWay === 'NORMAL') {
      const canDown = slotTarget.cardInstance === null ? true : false;
      return canDown;
    }

    return false;
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
    console.log(room.id);
    return 'ok';
  }
}
