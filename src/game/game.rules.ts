import { Room } from 'src/rooms/room.entity';
import { BoardSlot, BoardState, PlayerAction } from './game.types';
import { effectHandlers } from 'src/effects';
import { RoomsService } from 'src/rooms/rooms.service';
import { Injectable } from '@nestjs/common';

const TAG = '[GameRules]';

function log(step: string, msg: string) {
  console.log(`${TAG} [${step}] ${msg}`);
}

@Injectable()
export class GameRules {
  constructor(private readonly roomService: RoomsService) {}

  static isValidSlotChoice(front: number, back: number, max: number): boolean {
    const step = 'isValidSlotChoice';
    log(step, `front=${front}, back=${back}, max=${max}`);

    if (!Number.isInteger(front) || !Number.isInteger(back)) {
      log(step, `Valores não inteiros → false`);
      return false;
    }
    if (front < 0 || back < 0) {
      log(step, `Valores negativos → false`);
      return false;
    }

    const sum = front + back;
    const result = sum === max;
    log(step, `${front} + ${back} = ${sum}, expected ${max} → ${result}`);
    return result;
  }

  static buildAction(
    type: ActionsType,
    actionsPlayerOne: PlayerAction[],
    actionsPlayerTwo: PlayerAction[],
  ) {
    const step = 'buildAction';
    log(
      step,
      `type="${type}", P1=${actionsPlayerOne.length} actions, P2=${actionsPlayerTwo.length} actions`,
    );

    const allActionPlayerOneByType = actionsPlayerOne.filter(
      (action) => action.type === type,
    );
    log(step, `P1 filtradas por "${type}": ${allActionPlayerOneByType.length}`);

    const allActionPlayerTwoByType = actionsPlayerTwo.filter(
      (action) => action.type === type,
    );
    log(step, `P2 filtradas por "${type}": ${allActionPlayerTwoByType.length}`);

    const allActionsByType: PlayerAction[] = [];

    const limit = Math.max(
      allActionPlayerOneByType.length,
      allActionPlayerTwoByType.length,
    );
    log(step, `Intercalando até ${limit} rodadas`);

    for (let i = 0; i < limit; i++) {
      if (allActionPlayerOneByType[i] !== undefined) {
        log(
          step,
          `  rodada ${i}: adicionando P1 "${allActionPlayerOneByType[i].cardInstance.base.name ?? allActionPlayerOneByType[i].cardInstance.instanceId}"`,
        );
        allActionsByType.push(allActionPlayerOneByType[i]);
      }
      if (allActionPlayerTwoByType[i] !== undefined) {
        log(
          step,
          `  rodada ${i}: adicionando P2 "${allActionPlayerTwoByType[i].cardInstance.base.name ?? allActionPlayerTwoByType[i].cardInstance.instanceId}"`,
        );
        allActionsByType.push(allActionPlayerTwoByType[i]);
      }
    }

    log(step, `Resultado final: ${allActionsByType.length} ações intercaladas`);
    return allActionsByType;
  }

  async resolveSpell(
    roomId: string,
    allSpellUsed: PlayerAction[],
  ): Promise<boolean> {
    const step = 'resolveSpell';
    log(step, `Início — roomId="${roomId}", ${allSpellUsed.length} feitiços`);

    for (let i = 0; i < allSpellUsed.length; i++) {
      const action = allSpellUsed[i];
      log(
        step,
        `[${i + 1}/${allSpellUsed.length}] Processando carta="${action.cardInstance.instanceId}", abilityKey="${action.abilityKey}", owner="${action.owner}"`,
      );

      const room = await this.roomService.get(roomId);

      if (!room) {
        log(step, `ERRO: Room "${roomId}" não encontrada → abortando`);
        return false;
      }
      log(step, `Room "${roomId}" encontrada com sucesso`);

      const playerState =
        action.owner === 'PLAYERONE'
          ? room.state.playerOne
          : room.state.playerTwo;

      //deduzir mana
      const spellCost = action.cardInstance.base.mana;
      playerState.availableMana -= spellCost;
      log(
        step,
        `Mana deduzida: ${spellCost} → availableMana=${playerState.availableMana}`,
      );

      //remover spell da mão
      const handIndex = playerState.hand.findIndex(
        (c) => c.instanceId === action.cardInstance.instanceId,
      );
      if (handIndex !== -1) {
        playerState.hand.splice(handIndex, 1);
        log(step, `Spell removida da mão`);
      }

      await this.roomService.updateRoom(room);

      const handler = effectHandlers[action.abilityKey];

      if (!handler) {
        log(
          step,
          `AVISO: Effect handler "${action.abilityKey}" não encontrado → pulando`,
        );
        continue;
      }

      log(
        step,
        `Executando handler "${action.abilityKey}" — sourceCard="${action.targetCard?.instanceId ?? 'null'}", sourceSlot lane=${action.targetSlot?.lane ?? 'null'} pos=${action.targetSlot?.position ?? 'null'}`,
      );
      await handler(room, {
        sourceCard: action.targetCard || null,
        sourceSlot: action.targetSlot || null,
        owner: action.owner,
      });
      log(step, `Handler "${action.abilityKey}" executado com sucesso`);
    }

    log(step, `Fim — todos os feitiços processados`);
    return true;
  }

  static resolveMove(room: Room, allSpellUsed: PlayerAction[]): boolean {
    const step = 'resolveMove';
    log(
      step,
      `Início — roomId="${room.id}", ${allSpellUsed.length} movimentos`,
    );
    log(
      step,
      `Ações: ${JSON.stringify(allSpellUsed.map((a) => ({ id: a.cardInstance.instanceId, owner: a.owner })))}`,
    );
    log(step, `Fim — (não implementado)`);
    return true;
  }

  async resolveDownCard(
    roomId: string,
    allCardDown: PlayerAction[],
  ): Promise<boolean> {
    const step = 'resolveDownCard';
    log(
      step,
      `Início — roomId="${roomId}", ${allCardDown.length} cartas para baixar`,
    );

    for (let i = 0; i < allCardDown.length; i++) {
      const action = allCardDown[i];
      log(
        step,
        `[${i + 1}/${allCardDown.length}] Processando carta="${action.cardInstance.instanceId}", owner="${action.owner}", invoqueWay="${action.invoqueWay}", target=[lane=${action.targetSlot?.lane}, pos=${action.targetSlot?.position}]`,
      );

      const room = await this.roomService.get(roomId);

      if (!room) {
        log(step, `ERRO: Room "${roomId}" não encontrada → abortando`);
        return false;
      }
      log(step, `Room "${roomId}" encontrada`);

      const canDown = GameRules.canDown(action, room.state.board);

      if (canDown) {
        log(
          step,
          `canDown=TRUE → invocando carta "${action.cardInstance.instanceId}"`,
        );
        await this.invoceCard(room, action);
        log(
          step,
          `Carta "${action.cardInstance.instanceId}" invocada com sucesso`,
        );
      } else {
        log(
          step,
          `canDown=FALSE → carta "${action.cardInstance.instanceId}" não pode ser baixada`,
        );
      }
    }

    log(step, `Fim — todas as cartas processadas`);
    return true;
  }

  static canDown(action: PlayerAction, dashBoard: BoardState): boolean {
    const step = 'canDown';
    const targetInfo = action.targetSlot
      ? `[lane=${action.targetSlot.lane}, pos=${action.targetSlot.position}, owner=${action.targetSlot.owner}]`
      : 'nenhum';
    log(
      step,
      `Início — carta="${action.cardInstance.instanceId}", invoqueWay="${action.invoqueWay}", target=${targetInfo}`,
    );

    const cardInSlotSelect = dashBoard.slots.find(
      (slot) =>
        slot.lane === action.targetSlot?.lane &&
        slot.owner === action.targetSlot.owner &&
        slot.position === action.targetSlot.position,
    )?.cardInstance;

    log(
      step,
      `Slot alvo ${cardInSlotSelect ? `OCUPADO por "${cardInSlotSelect.instanceId}" (baseId="${cardInSlotSelect.base.id}", canEvolution=${cardInSlotSelect.state.canEvolution})` : 'VAZIO'}`,
    );

    if (action.invoqueWay === 'EVOLUTION') {
      log(
        step,
        `Verificando EVOLUTION — evolvesFromId="${action.cardInstance.base.evolvesFromId}" vs slotBaseId="${cardInSlotSelect?.base.id ?? 'null'}"`,
      );
      const hasBase = !!cardInSlotSelect;
      const matchesEvolves =
        action.cardInstance.base.evolvesFromId === cardInSlotSelect?.base.id;
      const canEvo = cardInSlotSelect?.state.canEvolution ?? false;
      const result = hasBase && matchesEvolves && canEvo;
      log(
        step,
        `EVOLUTION: hasBase=${hasBase}, matchesEvolves=${matchesEvolves}, canEvo=${canEvo} → ${result}`,
      );
      return result;
    }

    if (action.invoqueWay === 'NORMAL') {
      const isBaseCard = action.cardInstance.base.evolvesFromId === null;
      const slotEmpty = !cardInSlotSelect;
      const result = slotEmpty && isBaseCard;
      log(
        step,
        `NORMAL: slotEmpty=${slotEmpty}, isBaseCard(evolvesFromId===null)=${isBaseCard} → ${result}`,
      );
      return result;
    }

    log(step, `invoqueWay="${action.invoqueWay}" desconhecido → false`);
    return false;
  }

  async invoceCard(room: Room, action: PlayerAction) {
    const step = 'invoceCard';
    log(
      step,
      `Início — roomId="${room.id}", carta="${action.cardInstance.instanceId}", owner="${action.owner}"`,
    );

    if (!action.targetSlot) {
      log(step, `ERRO: targetSlot ausente → retornando erro`);
      return {
        success: false,
        message: 'Esta ação requer um slot alvo',
      };
    }
    log(
      step,
      `targetSlot: [lane=${action.targetSlot.lane}, pos=${action.targetSlot.position}]`,
    );

    const playerState =
      action.owner === 'PLAYERONE'
        ? room.state.playerOne
        : room.state.playerTwo;
    const playerHand = playerState.hand;
    log(step, `Mão do jogador: ${playerHand.length} cartas`);

    const indexOfInstanceCard = playerHand.findIndex((cardIntance) => {
      return cardIntance.instanceId === action.cardInstance.instanceId;
    });

    log(
      step,
      `Buscando carta "${action.cardInstance.instanceId}" na mão → index=${indexOfInstanceCard}`,
    );

    if (indexOfInstanceCard === -1) {
      log(
        step,
        `ERRO: Carta "${action.cardInstance.instanceId}" não encontrada na mão`,
      );
      throw new Error(
        `Card with instanceId ${action.cardInstance.instanceId} not found in player's hand`,
      );
    }

    const [cardRemoved] = playerHand.splice(indexOfInstanceCard, 1);
    log(
      step,
      `Carta removida da mão — "${cardRemoved.instanceId}" (mão agora: ${playerHand.length} cartas)`,
    );

    const realBoardSlot = room.state.board.slots.find(
      (s) =>
        s.lane === action.targetSlot!.lane &&
        s.position === action.targetSlot!.position &&
        s.owner === action.owner,
    );
    log(
      step,
      `Slot real no board: ${realBoardSlot ? `[lane=${realBoardSlot.lane}, pos=${realBoardSlot.position}, owner=${realBoardSlot.owner}]` : 'não encontrado (usando action.targetSlot)'}`,
    );

    const slotForValidation = realBoardSlot || action.targetSlot;
    const canInvoke: boolean = GameRules.validateSlotForCard(
      action,
      slotForValidation,
      cardRemoved,
    );

    log(step, `validateSlotForCard → ${canInvoke}`);

    if (!canInvoke) {
      log(step, `ERRO: Slot não pode receber esta carta`);
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
    log(
      step,
      `Montando BoardSlot: [lane=${boardSlot.lane}, pos=${boardSlot.position}, owner=${boardSlot.owner}, card="${boardSlot.cardInstance?.instanceId}"]`,
    );

    await this.roomService.updateHand(room.id, action.owner, playerHand);
    log(
      step,
      `Mão atualizada no Redis — roomId="${room.id}", owner="${action.owner}", ${playerHand.length} cartas`,
    );

    await this.roomService.updateSlot(room.id, boardSlot);
    log(
      step,
      `Slot atualizado no Redis — [lane=${boardSlot.lane}, pos=${boardSlot.position}, owner=${boardSlot.owner}]`,
    );

    log(step, `Fim — carta invocada com sucesso`);
  }

  static validateSlotForCard(
    action: PlayerAction,
    slotTarget: BoardSlot,
    cardRemoved: CardInstance,
  ): boolean {
    const step = 'validateSlotForCard';
    log(
      step,
      `Início — invoqueWay="${action.invoqueWay}", slot=[lane=${slotTarget.lane}, pos=${slotTarget.position}, owner=${slotTarget.owner}], card="${cardRemoved.instanceId}"`,
    );

    if (action.invoqueWay === 'EVOLUTION') {
      const slotBaseId = slotTarget.cardInstance?.base.id ?? 'null';
      const cardEvolvesFrom = cardRemoved.base.evolvesFromId;
      const canEvolution =
        slotTarget.cardInstance?.base.id === cardRemoved.base.evolvesFromId;
      log(
        step,
        `EVOLUTION: slotBaseId="${slotBaseId}", cardEvolvesFrom="${cardEvolvesFrom}" → ${canEvolution}`,
      );
      return canEvolution;
    }

    if (action.invoqueWay === 'NORMAL') {
      const slotEmpty = !slotTarget.cardInstance;
      log(step, `NORMAL: slot vazio=${slotEmpty} → ${slotEmpty}`);
      return slotEmpty;
    }

    log(step, `invoqueWay="${action.invoqueWay}" desconhecido → false`);
    return false;
  }

  async resolveAttack(
    roomId: string,
    allAttackUsed: PlayerAction[],
  ): Promise<boolean> {
    const step = 'resolveAttack';
    log(step, `Início — roomId="${roomId}", ${allAttackUsed.length} ataques`);

    let room = await this.roomService.get(roomId);

    if (!room) {
      log(step, `ERRO: Room "${roomId}" não encontrada → abortando`);
      return false;
    }

    for (let i = 0; i < allAttackUsed.length; i++) {
      const action = allAttackUsed[i];
      log(
        step,
        `[${i + 1}/${allAttackUsed.length}] Atacante="${action.cardInstance.instanceId}", owner="${action.owner}", target=[lane=${action.targetSlot?.lane}, pos=${action.targetSlot?.position}, owner=${action.targetSlot?.owner}]`,
      );

      room = await this.roomService.get(roomId);

      if (!room) {
        log(step, `ERRO: Room "${roomId}" não encontrada → abortando`);
        return false;
      }
      log(step, `Room "${roomId}" encontrada`);

      const board = room.state.board;

      const inRange = GameRules.attackHasInRange(action, board);
      log(step, `attackHasInRange → ${inRange}`);

      if (!inRange) {
        log(step, `Ataque fora de alcance → pulando`);
        continue;
      }

      const attackerSlot = GameRules.findAttackerSlot(action, board);
      const targetSlot = GameRules.findTargetSlot(action, board);

      if (!attackerSlot?.cardInstance) {
        log(step, `Atacante não encontrado no board → pulando`);
        continue;
      }

      if (!targetSlot?.cardInstance) {
        log(step, `Alvo não encontrado no board → pulando`);
        continue;
      }

      await this.applyDamege(roomId, attackerSlot, targetSlot);
    }

    log(step, `Fim — todos os ataques processados`);
    return true;
  }

  static findAttackerSlot(
    action: PlayerAction,
    board: BoardState,
  ): BoardSlot | undefined {
    return board.slots.find(
      (s) =>
        s.owner === action.owner &&
        s.cardInstance?.instanceId === action.cardInstance.instanceId,
    );
  }

  static findTargetSlot(
    action: PlayerAction,
    board: BoardState,
  ): BoardSlot | undefined {
    if (!action.targetSlot) return undefined;

    return board.slots.find(
      (s) =>
        s.lane === action.targetSlot!.lane &&
        s.position === action.targetSlot!.position &&
        s.owner === action.targetSlot!.owner,
    );
  }

  static attackHasInRange(
    action: PlayerAction,
    dashBoard: BoardState,
  ): boolean {
    const step = 'attackHasInRange';

    if (!action.targetSlot) {
      log(step, `targetSlot ausente → false`);
      return false;
    }

    const attackerSlot = dashBoard.slots.find(
      (s) =>
        s.owner === action.owner &&
        s.cardInstance?.instanceId === action.cardInstance.instanceId,
    );

    if (!attackerSlot) {
      log(
        step,
        `Atacante="${action.cardInstance.instanceId}" não encontrado no board → false`,
      );
      return false;
    }

    if (!attackerSlot.cardInstance) {
      log(step, `Sem card no lost atacante`);
      return false;
    }

    const attackerRange = attackerSlot.cardInstance.base?.range ?? 0;

    if (attackerRange === 0 || attackerRange === null) {
      log(step, 'Card não possui range para atacar.');
      return false;
    }

    let rangedNeed = 0;

    if (attackerSlot.position === 'BACK') {
      rangedNeed = action.targetSlot.position === 'FRONT' ? 2 : 3;
    } else if (attackerSlot.position === 'FRONT') {
      rangedNeed = action.targetSlot.position === 'FRONT' ? 1 : 2;
    }

    const canAttack = rangedNeed <= attackerRange ? true : false;

    return canAttack;
  }

  async applyDamege(
    roomId: string,
    attackerSlot: BoardSlot,
    targetSlot: BoardSlot,
  ) {
    const step = 'executeAttck';

    if (attackerSlot.cardInstance?.state.hasAttacked) {
      return {
        success: false,
        message: 'Essa carta já atacou nesse turno',
      };
    }

    if (!attackerSlot || !attackerSlot.cardInstance) {
      log(step, 'Atacante não encontrado no board');
      return { success: false, message: 'Atacante não encontrado' };
    }

    if (!targetSlot || !targetSlot.cardInstance) {
      log(step, 'Alvo não encontrado no board');
      return { success: false, message: 'Alvo não encontrado' };
    }

    const damage = attackerSlot.cardInstance.state.currentAttack;
    const currentLife = targetSlot.cardInstance.state?.currentLife || 0;
    const newLife = Math.max(0, currentLife - damage);
    targetSlot.cardInstance.state.currentLife = newLife;

    attackerSlot.cardInstance.state.hasAttacked = true;

    await this.roomService.updateSlot(roomId, targetSlot);
    await this.roomService.updateSlot(roomId, attackerSlot);

    return {
      success: true,
      message: `Dano de ${damage} aplicado ao alvo`,
      damage,
      newLife,
    };
  }

  async resolveDead(room: Room) {
    const step = 'resolveDead';
    log(step, `Verificando mortes na sala ${room.id}`);

    let hasDeaths = false;
    let newPointsPlayerOne = 0;
    let newPointsPlayerTwo = 0;
    let removedCount = 0;

    for (const slot of room.state.board.slots) {
      if (slot.cardInstance && slot.cardInstance.state.currentLife <= 0) {
        hasDeaths = true;
        removedCount++;

        if (slot.owner === 'PLAYERONE') {
          room.state.playerOne.graveyard.push(slot.cardInstance.instanceId);
          const countPoint = GameRules.countPoint(slot.cardInstance);
          newPointsPlayerTwo += countPoint;
        } else {
          room.state.playerTwo.graveyard.push(slot.cardInstance.instanceId);
          const countPoint = GameRules.countPoint(slot.cardInstance);
          newPointsPlayerOne += countPoint;
        }

        slot.cardInstance = undefined;
      }
    }

    if (newPointsPlayerOne > 0) {
      room.state.playerOne.victoryPoints += newPointsPlayerOne;
      log(step, `PLAYERONE ganhou ${newPointsPlayerOne} ponto(s) de vitória`);
    }

    if (newPointsPlayerTwo > 0) {
      room.state.playerTwo.victoryPoints += newPointsPlayerTwo;
      log(step, `PLAYERTWO ganhou ${newPointsPlayerTwo} ponto(s) de vitória`);
    }

    if (hasDeaths) {
      await this.roomService.updateRoom(room);
      log(step, `${removedCount} carta(s) morta(s) removida(s) do board`);
    } else {
      log(step, `Nenhuma carta morta encontrada`);
    }
  }

  static countPoint(cardInstance: CardInstance): number {
    // Pontos base da carta (ex: custo, nível, etc.)
    let points = 1;

    // Pontos extras por equipamentos
    const equipmentCount = cardInstance.state?.equipment?.length || 0;
    points += equipmentCount;

    // Bônus por cartas lendárias (exemplo)
    if (cardInstance.base?.rarity === 'LEGENDARY') {
      points += 2;
    }

    return points;
  }
}
