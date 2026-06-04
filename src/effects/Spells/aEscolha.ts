import { ServerGameState } from 'src/game/game.types';

export function aEscolha(state: ServerGameState, context: EffectContext) {
  console.log(
    `A magia A escolha foi utilizada em: ${JSON.stringify(context.sourceSlot)}`,
  );
  return state;
}
