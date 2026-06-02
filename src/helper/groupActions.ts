import { PlayerAction } from 'src/game/game.types';

export interface GroupedActions {
  spells: PlayerAction[];
  abilities: PlayerAction[];
  downCards: PlayerAction[];
  moves: PlayerAction[];
  attacks: PlayerAction[];
  evolutions: PlayerAction[];
}

export function groupActions(actions: PlayerAction[]): GroupedActions {
  return {
    spells: actions.filter((a) => a.type === 'CAST_SPELL'),
    abilities: actions.filter((a) => a.type === 'ACTIVATE_ABILITY'),
    downCards: actions.filter((a) => a.type === 'DOWN_CARD'),
    moves: actions.filter((a) => a.type === 'MOVE'),
    attacks: actions.filter((a) => a.type === 'ATTACK'),
    evolutions: actions.filter((a) => a.type === 'EVOLUTION'),
  };
}
