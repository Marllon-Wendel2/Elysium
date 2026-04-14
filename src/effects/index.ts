import { ServerGameState } from 'src/game/game.types';
import { arthurEscolhido } from './arthurEscolhido';

export const effectHandlers: Record<
  EffectKey,
  (state: ServerGameState, context: EffectContext) => ServerGameState
> = {
  arthurEscolhido,
  DAMAGE: (state) => state,
  HEAL: (state) => state,
};
