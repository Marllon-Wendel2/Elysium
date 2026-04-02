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
    PLAYERONE?: SlotChoice | null;
    PLAYERTWO?: SlotChoice | null;
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
  cardInstanceId?: string;
}

type Position = 'FRONT' | 'BACK';

interface PlayerState {
  hand: CardInstance[];
  deck: CardInstance[];
  graveyard: string[];
  victoryPoints: number;
  totalMana: number;
  availableMana: number;
}

export interface PlayerGameView {
  phase: GamePhase;
  turn: number;

  board: BoardState;

  you: {
    hand: CardInstance[];
    deckCount: number;
    victoryPoints: number;
    totalMana: number;
    manaAvailable: number;
  };

  opponent: {
    handCount: number;
    deckCount: number;
    victoryPoints: number;
  };
  winner: 'PLAYERONE' | 'PLAYERTWO' | 'NONE' | 'DRAW';
}
