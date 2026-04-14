import { Card } from '@prisma/client';
import { BoardSlot } from './game/game.types';

declare global {
  type CardInstance = {
    instanceId: string;
    base: Card;
    state: {
      currentLife: number;
      currentEnergy: number;
      isOnBoard: boolean;
      hasAttacked: boolean;
    };
    status: string[];
  };

  type Ability = {
    trigger: 'START_TURN' | 'END_TURN';
    effect: string;
  };

  type EffectContext = {
    sourceCard: CardInstance;
    sourceSlot: BoardSlot;
    owner: 'PLAYERONE' | 'PLAYERTWO';
  };

  type EffectKey = 'arthurEscolhido' | 'DAMAGE' | 'HEAL';
}
