import { ServerGameState } from './game.types';

export const initialState: ServerGameState = {
  phase: 'MENU',
  currentTurn: 'PLAYER',

  board: {
    slots: [],
  },

  player: {
    hand: [],
    deck: 0,
    victoryPoints: 0,
    totalMana: 0,
    manaAvailable: 0,
  },
  inimyPlayer: {
    hand: [],
    deck: 0,
    victoryPoints: 0,
    totalMana: 0,
    manaAvailable: 0,
  },

  turn: 0,
  winner: 'NONE',
  showInfos: false,
};
