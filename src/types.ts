import { Card } from '@prisma/client';

declare global {
  type CardInstance = {
    instanceId: string;
    base: Card;
    state: {
      currentLife: number;
      currentEnergy: number;
      isOnBoard: boolean;
      hasAttacked: boolean;
    };
  };
}
