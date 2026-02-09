export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface Card {
  id: string;
  templateId: string;
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
  effect?: CardEffect;
  attachments: Card[];
  description: string;
}

interface CardEffect {
  type: 'DAMAGE' | 'HEAL' | 'DRAW' | 'BUFF' | 'DEBUFF';
  value: number;
}
