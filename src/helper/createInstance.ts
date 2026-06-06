import { Card } from '@prisma/client';

export function createInstanceOfDeck(deck: {
  cards: {
    card: Card;
    cardId: string;
    quantity: number;
  }[];
}): CardInstance[] {
  return deck.cards.flatMap((c) =>
    Array.from({ length: c.quantity }, () => ({
      instanceId: crypto.randomUUID(),

      base: {
        ...c.card,
        ability: Array.isArray(c.card.ability)
          ? (c.card.ability as Ability[])
          : [],
      },

      state: {
        currentLife: c.card.life ?? 0,
        currentEnergy: c.card.energy ?? 0,
        isOnBoard: false,
        hasAttacked: false,
      },
      status: [],
    })),
  );
}

export function createFirstHand(deck: CardInstance[]) {
  const hand = deck.splice(0, 5);

  const hasBaseUnit = hand.some(isBaseUnit);

  if (!hasBaseUnit) {
    const index = deck.findIndex(isBaseUnit);

    if (index !== -1) {
      const [validCard] = deck.splice(index, 1);

      const removed = hand.pop();

      hand.push(validCard);

      if (removed) {
        deck.unshift(removed);
      }
    }
  }

  return hand;
}

function isBaseUnit(card: CardInstance): boolean {
  return card.base.type === 'UNIT' && card.base.evolvesFromId === null;
}
