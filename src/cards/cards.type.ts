export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface Card {
  id: string;
  name: string;
  mana: number;
  energy: number;
  energyUsed: number;
  class: string;
  attack: number;
  life: number;
  rarity: Rarity;
  artUrl: string;
  range: number;
  canAttack: boolean;
  canEvolve: boolean;
  attachments: Card[];
  abilities: Ability[];
  description: string;
  status?: {
    movementLocked?: boolean;
    silenced?: boolean;
  };
}

export interface Ability {
  key: string;
  name: string;
  description: string;
  trigger: 'ON_PLAY' | 'START_TURN' | 'END_TURN' | 'PASSIVE';
}
