import { Card } from 'src/cards/cards.type';

export type GamePhase =
  | 'WAITING'
  | 'SETUP'
  | 'STANDBY'
  | 'DECLARATION'
  | 'RESOLUTION'
  | 'FINISHED';

export interface ServerGameState {
  phase: GamePhase;
  turn: number;

  pendingActions: {
    PLAYERONE: PlayerAction[];
    PLAYERTWO: PlayerAction[];
  };

  board: BoardState;

  playerOne: PlayerState;
  playerTwo: PlayerState;

  slotChoices?: {
    PLAYERONE?: SlotChoice;
    PLAYERTWO?: SlotChoice;
  };

  winner: 'PLAYERONE' | 'PLAYERTWO' | 'NONE' | 'DRAW';
  showInfos: boolean;
}

export interface PlayerAction {
  type: 'CAST_SPELL' | 'ACTIVATE_ABILITY' | 'MOVE' | 'ATTACK';
  sourceCardId: string;
  targetId?: string;
  abilityKey?: string;
  slotIndex?: number;
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
  phase: GamePhase;
  turn: number;

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
  winner: 'PLAYERONE' | 'PLAYERTWO' | 'NONE' | 'DRAW';
}
