import { ServerGameState } from './game.types';

export const initialState: ServerGameState = {
  phase: 'WAITING',
  turn: 0,

  pendingActions: {
    PLAYERONE: [],
    PLAYERTWO: [],
  },

  board: {
    slots: [],
  },
  playerOne: {
    hand: [],
    deck: [],
    victoryPoints: 0,
    totalMana: 0,
    manaAvailable: 0,
  },
  playerTwo: {
    hand: [],
    deck: [],
    victoryPoints: 0,
    totalMana: 0,
    manaAvailable: 0,
  },

  winner: 'NONE',
  showInfos: false,
};
