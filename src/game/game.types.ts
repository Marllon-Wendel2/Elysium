import { Card } from 'src/cards/cards.type';

export interface ServerGameState {
  phase: 'PLAYING' | 'FINISHED' | 'WAITING' | 'SETUP';
  currentTurn: 'PLAYERONE' | 'PLAYERTWO' | 'NONE';

  board: BoardState;

  playerOne: PlayerState;
  playerTwo: PlayerState;

  slotChoices?: {
    PLAYERONE?: SlotChoice;
    PLAYERTWO?: SlotChoice;
  };

  turn: number;
  winner: 'PLAYERONE' | 'PLAYERTWO' | 'NONE' | 'DRAW';
  showInfos: boolean;
}

interface BoardState {
  slots: BoardSlot[];
}

export interface SlotChoice {
  front: number;
  back: number;
}

export interface BoardSlot {
  lane: number;
  position: Position;
  owner: 'PLAYERONE' | 'PLAYERTWO';
  card?: Card;
}

type Position = 'FRONT' | 'BACK';

interface PlayerState {
  hand: Card[];
  deck: Card[];
  victoryPoints: number;
  totalMana: number;
  manaAvailable: number;
}

export interface PlayerGameView {
  phase: 'PLAYING' | 'FINISHED' | 'WAITING' | 'SETUP';
  currentTurn: 'PLAYERONE' | 'PLAYERTWO' | 'NONE';

  board: BoardState;

  you: {
    hand: Card[];
    deckCount: number;
    victoryPoints: number;
    totalMana: number;
    manaAvailable: number;
  };

  opponent: {
    handCount: number;
    deckCount: number;
    victoryPoints: number;
    board: BoardState;
  };

  turn: number;
  winner: 'PLAYERONE' | 'PLAYERTWO' | 'NONE' | 'DRAW';
}
