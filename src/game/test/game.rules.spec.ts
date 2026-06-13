import { GameRules } from '../game.rules';
import { BoardSlot, BoardState, PlayerAction } from '../game.types';
import { Room } from '../../rooms/room.entity';
import { RoomsService } from '../../rooms/rooms.service';
import { initialState } from '../game.state';

function makeCard(
  overrides?: Partial<CardInstance>,
  cardNumber = 1,
): CardInstance {
  return {
    instanceId: `card-${cardNumber}`,
    base: {
      id: `base${cardNumber}`,
      evolvesFromId: null,
    } as GameCard,
    state: {
      canEvolution: false,
      currentEnergy: 2,
      hasAttacked: false,
      isOnBoard: false,
      currentLife: 2,
    },
    status: [],
    ...overrides,
  };
}

function makeAction(overrides?: Partial<PlayerAction>): PlayerAction {
  return {
    type: 'DOWN_CARD',
    cardInstance: makeCard(),
    targetSlot: { lane: 0, position: 'FRONT', owner: 'PLAYERONE' },
    abilityKey: '',
    owner: 'PLAYERONE',
    invoqueWay: 'NORMAL',
    ...overrides,
  };
}

type SlotOccupant = {
  lane: number;
  position: 'FRONT' | 'BACK';
  owner: 'PLAYERONE' | 'PLAYERTWO';
  cardInstance: CardInstance;
};

function makeBoard(occupiedSlots?: SlotOccupant[]): BoardState {
  const slots: BoardSlot[] = [];
  for (const lane of [0, 1, 2, 3, 4]) {
    for (const position of ['FRONT', 'BACK'] as const) {
      for (const owner of ['PLAYERONE', 'PLAYERTWO'] as const) {
        const occupied = occupiedSlots?.find(
          (s) =>
            s.lane === lane && s.position === position && s.owner === owner,
        );
        slots.push({
          lane,
          position,
          owner,
          cardInstance: occupied?.cardInstance,
        });
      }
    }
  }
  return { slots };
}

function makeRoom(hand: CardInstance[]): Room {
  return new Room(
    'room-1',
    [{ player: 'PLAYER ONE', id: 'p1' }],
    {
      ...initialState,
      board: makeBoard(),
      playerOne: { ...initialState.playerOne, hand },
    },
    'PLAYING',
  );
}

const mockRoomService = {
  updateHand: jest.fn().mockResolvedValue(null),
  updateSlot: jest.fn().mockResolvedValue(null),
};

describe('GameRules.canDown', () => {
  it('Deve retornar true para baixar carta normal em um slot vazio', () => {
    const action = makeAction();
    const board = makeBoard();

    const result = GameRules.canDown(action, board);

    expect(result).toBe(true);
  });

  it('Deve retornar true para evolução válida', () => {
    const baseCard = makeCard({
      instanceId: 'base',
      base: { id: 'base-1', evolvesFromId: null } as GameCard,
      state: {
        canEvolution: true,
        currentEnergy: 0,
        hasAttacked: false,
        isOnBoard: false,
        currentLife: 4,
      },
    });
    const evoCard = makeCard({
      instanceId: 'evo',
      base: { id: 'evo-1', evolvesFromId: 'base-1' } as GameCard,
    });

    const action = makeAction({
      cardInstance: evoCard,
      invoqueWay: 'EVOLUTION',
    });
    const board = makeBoard([
      {
        lane: 0,
        position: 'FRONT',
        owner: 'PLAYERONE',
        cardInstance: baseCard,
      },
    ]);

    const result = GameRules.canDown(action, board);

    expect(result).toBe(true);
  });

  it('Deve retornar false se carta base não puder evoluir', () => {
    const baseCard = makeCard({
      instanceId: 'base',
      base: { id: 'base-1', evolvesFromId: null } as GameCard,
      state: {
        canEvolution: false,
        currentEnergy: 0,
        hasAttacked: false,
        isOnBoard: false,
        currentLife: 4,
      },
    });
    const evoCard = makeCard({
      instanceId: 'evo',
      base: { id: 'evo-1', evolvesFromId: 'base-1' } as GameCard,
    });

    const action = makeAction({
      cardInstance: evoCard,
      invoqueWay: 'EVOLUTION',
    });
    const board = makeBoard([
      {
        lane: 0,
        position: 'FRONT',
        owner: 'PLAYERONE',
        cardInstance: baseCard,
      },
    ]);

    const result = GameRules.canDown(action, board);

    expect(result).toBe(false);
  });
});

describe('GameRules.invoceCard', () => {
  let gameRules: GameRules;

  beforeEach(() => {
    gameRules = new GameRules(mockRoomService as any);
    jest.clearAllMocks();
  });

  it('deve retornar erro se targetSlot não existir', async () => {
    const card = makeCard();
    const room = makeRoom([card]);
    const action = makeAction({ targetSlot: undefined });

    const result = await gameRules.invoceCard(room, action);

    expect(result).toEqual({
      success: false,
      message: 'Esta ação requer um slot alvo',
    });
  });

  it('deve lançar erro se carta não estiver na mão', async () => {
    const card = makeCard({ instanceId: 'card-1' });
    const room = makeRoom([card]);
    const action = makeAction({
      cardInstance: makeCard({ instanceId: 'not-exist' }),
    });

    await expect(gameRules.invoceCard(room, action)).rejects.toThrow(
      "Card with instanceId not-exist not found in player's hand",
    );
  });

  it('deve retornar erro se slot estiver ocupado', async () => {
    const card = makeCard({ instanceId: 'card-1' });
    const room = makeRoom([card]);
    const occupyingCard = makeCard({ instanceId: 'other' });

    // Ocupa o slot real no board
    const targetSlot = room.state.board.slots.find(
      (s) => s.lane === 0 && s.position === 'FRONT' && s.owner === 'PLAYERONE',
    );
    if (targetSlot) targetSlot.cardInstance = occupyingCard;

    const action = makeAction();

    const result = await gameRules.invoceCard(room, action);

    expect(result).toEqual({
      success: false,
      message: 'Essa carta não pode ser invocada',
    });
  });

  it('deve invocar carta com sucesso (NORMAL)', async () => {
    const card = makeCard({ instanceId: 'card-1' });
    const room = makeRoom([card]);
    const action = makeAction();

    await gameRules.invoceCard(room, action);

    // Hand deveria estar vazia após remover a carta
    expect(mockRoomService.updateHand).toHaveBeenCalledWith(
      'room-1',
      'PLAYERONE',
      [],
    );

    // Slot deveria receber a carta
    expect(mockRoomService.updateSlot).toHaveBeenCalledWith(
      'room-1',
      expect.objectContaining({
        lane: 0,
        position: 'FRONT',
        owner: 'PLAYERONE',
        cardInstance: expect.objectContaining({ instanceId: 'card-1' }),
      }),
    );
  });
});
