export interface ServerGameState {
  phase: 'PLAYING' | 'FINISHED' | 'WAITING';
  currentTurn: 'PLAYERONE' | 'PLAYERTWO' | 'NONE';

  board: BoardState;

  playerOne: PlayerState;
  playerTwo: PlayerState;

  turn: number;
  winner: 'PLAYERONE' | 'PLAYERTWO' | 'NONE' | 'DRAW';
  showInfos: boolean;
}

interface BoardState {
  slots: BoardSlot[];
}

interface BoardSlot {
  lane: 0 | 1 | 2;
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

interface Card {
  id?: string;
  name: string;
  mana: number;
  energy: number;
  energyUsend: number;
  class: string;
  attack: number;
  life: number;
  art: string;
  range: number;
  canAttack: boolean;
  canEvolve: boolean;
  effect?: CardEffect;
  apend: Card[];
}

interface CardEffect {
  type: 'DAMAGE' | 'HEAL' | 'DRAW' | 'BUFF' | 'DEBUFF';
  value: number;
}

export interface PlayerGameView {
  phase: 'PLAYING' | 'FINISHED' | 'WAITING';
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
