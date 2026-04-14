import { ServerGameState } from 'src/game/game.types';

export function arthurEscolhido(
  state: ServerGameState,
  context: EffectContext,
) {
  for (const slot of state.board.slots) {
    if (slot.owner !== context.owner) continue;

    const card = slot.cardInstance;
    if (!card) continue;

    if (!card.status) card.status = [];

    if (!card.status.includes('PROTECTED')) {
      card.status.push('PROTECTED');
    }
  }

  return state;
}
