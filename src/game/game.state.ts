import { ServerGameState } from './game.types';

export const initialState: ServerGameState = {
  phase: 'WAITING',
  turn: 0,

  pendingActions: {
    PLAYERONE: [],
    PLAYERTWO: [],
  },

  slotChoices: {
    PLAYERONE: null,
    PLAYERTWO: null,
  },

  board: {
    slots: [],
  },
  playerOne: {
    hand: [],
    deck: [],
    graveyard: [],
    victoryPoints: 0,
    totalMana: 0,
    availableMana: 0,
  },
  playerTwo: {
    hand: [],
    deck: [],
    graveyard: [],
    victoryPoints: 0,
    totalMana: 0,
    availableMana: 0,
  },

  winner: 'NONE',
  showInfos: false,
};
