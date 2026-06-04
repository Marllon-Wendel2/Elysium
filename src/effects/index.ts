import { ServerGameState } from 'src/game/game.types';
import { arthurEscolhido } from './arthurEscolhido';
import { aEscolha } from './Spells/aEscolha';

export const effectHandlers: Record<
  string,
  (state: ServerGameState, context: EffectContext) => ServerGameState
> = {
  arthurEscolhido,
  aEscolha,
  DAMAGE: (state) => state,
  HEAL: (state) => state,
};
