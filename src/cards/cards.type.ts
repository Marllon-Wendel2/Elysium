export interface CardInstance {
  instanceId: string;
  templateId: string;

  ownerId: string;
  currentLife: number;
  currentAttack: number;
  currentEnergy: number;

  position?: number;
  status: StatusState;

  canAttack: boolean;
  canMove: boolean;
}

export interface StatusState {
  burn?: number;
  frozen?: number;
  stun?: number;
  marked?: number;
}

export interface WarriorInstance extends CardInstance {
  currentLife: number;
  currentAttack: number;

  baseMana: number;
  currentMana: number;

  baseEnergy: number;
  currentEnergy: number;
  energyUsed: number;

  equipments: string[];
}

export interface EquipmentInstance extends CardInstance {
  attachedTo: string; // warrior instanceId
}
