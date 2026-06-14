import { GameRules } from '../game.rules';
import { BoardSlot, BoardState, PlayerAction } from '../game.types';
import { Room } from '../../rooms/room.entity';
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
      currentAttack: 2,
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
      playerTwo: { ...initialState.playerTwo },
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
        currentAttack: 2,
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
        currentAttack: 2,
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

describe('GameRules.findAttackerSlot', () => {
  it('deve encontrar slot do atacante', () => {
    const attacker = makeCard({ instanceId: 'att-1', base: { id: 'b1', evolvesFromId: null, range: 1 } as GameCard });
    const board = makeBoard([
      { lane: 1, position: 'FRONT', owner: 'PLAYERONE', cardInstance: attacker },
    ]);
    const action = makeAction({ cardInstance: attacker, owner: 'PLAYERONE' });

    const result = GameRules.findAttackerSlot(action, board);

    expect(result).toBeDefined();
    expect(result?.lane).toBe(1);
    expect(result?.position).toBe('FRONT');
  });

  it('deve retornar undefined se atacante não estiver no board', () => {
    const attacker = makeCard({ instanceId: 'att-1' });
    const board = makeBoard([]);
    const action = makeAction({ cardInstance: attacker, owner: 'PLAYERONE' });

    const result = GameRules.findAttackerSlot(action, board);

    expect(result).toBeUndefined();
  });
});

describe('GameRules.findAttackTarget', () => {
  it('deve encontrar slot do alvo', () => {
    const target = makeCard({ instanceId: 'tgt-1' });
    const board = makeBoard([
      { lane: 2, position: 'FRONT', owner: 'PLAYERTWO', cardInstance: target },
    ]);
    const action = makeAction({
      targetSlot: { lane: 2, position: 'FRONT', owner: 'PLAYERTWO' },
    });

    const result = GameRules.findAttackTarget(action, board);

    expect(result).toBeDefined();
    expect(result?.lane).toBe(2);
    expect(result?.owner).toBe('PLAYERTWO');
  });

  it('deve retornar undefined se targetSlot não existir na action', () => {
    const board = makeBoard([]);
    const action = makeAction({ targetSlot: undefined });

    const result = GameRules.findAttackTarget(action, board);

    expect(result).toBeUndefined();
  });
});

describe('GameRules.attackHasInRange', () => {
  const rangeCard = (range: number) =>
    makeCard({
      base: { id: 'b1', evolvesFromId: null, range } as GameCard,
    });

  it('deve permitir ataque frontal same lane (range 1)', () => {
    const attacker = rangeCard(1);
    const board = makeBoard([
      { lane: 0, position: 'FRONT', owner: 'PLAYERONE', cardInstance: attacker },
      { lane: 0, position: 'FRONT', owner: 'PLAYERTWO', cardInstance: makeCard({ instanceId: 't1' }) },
    ]);
    const action = makeAction({
      cardInstance: attacker,
      owner: 'PLAYERONE',
      targetSlot: { lane: 0, position: 'FRONT', owner: 'PLAYERTWO' },
    });

    expect(GameRules.attackHasInRange(action, board)).toBe(true);
  });

  it('deve bloquear ataque de range 1 para target BACK (range insuficiente)', () => {
    const attacker = rangeCard(1);
    const board = makeBoard([
      { lane: 0, position: 'FRONT', owner: 'PLAYERONE', cardInstance: attacker },
      { lane: 0, position: 'BACK', owner: 'PLAYERTWO', cardInstance: makeCard({ instanceId: 't1' }) },
    ]);
    const action = makeAction({
      cardInstance: attacker,
      owner: 'PLAYERONE',
      targetSlot: { lane: 0, position: 'BACK', owner: 'PLAYERTWO' },
    });

    expect(GameRules.attackHasInRange(action, board)).toBe(false);
  });

  it('deve permitir ataque de range 2 para target BACK same lane', () => {
    const attacker = rangeCard(2);
    const board = makeBoard([
      { lane: 0, position: 'FRONT', owner: 'PLAYERONE', cardInstance: attacker },
      { lane: 0, position: 'BACK', owner: 'PLAYERTWO', cardInstance: makeCard({ instanceId: 't1' }) },
    ]);
    const action = makeAction({
      cardInstance: attacker,
      owner: 'PLAYERONE',
      targetSlot: { lane: 0, position: 'BACK', owner: 'PLAYERTWO' },
    });

    expect(GameRules.attackHasInRange(action, board)).toBe(true);
  });

  it('deve bloquear ataque cross-lane com range insuficiente', () => {
    const attacker = rangeCard(1);
    const board = makeBoard([
      { lane: 0, position: 'FRONT', owner: 'PLAYERONE', cardInstance: attacker },
      { lane: 2, position: 'FRONT', owner: 'PLAYERTWO', cardInstance: makeCard({ instanceId: 't1' }) },
    ]);
    const action = makeAction({
      cardInstance: attacker,
      owner: 'PLAYERONE',
      targetSlot: { lane: 2, position: 'FRONT', owner: 'PLAYERTWO' },
    });

    // requiredRange = laneDistance(2) + baseCost(1) + targetPenalty(0) = 3
    expect(GameRules.attackHasInRange(action, board)).toBe(false);
  });

  it('deve retornar false se atacante não estiver no board', () => {
    const attacker = rangeCard(5);
    const board = makeBoard([]);
    const action = makeAction({
      cardInstance: attacker,
      owner: 'PLAYERONE',
      targetSlot: { lane: 0, position: 'FRONT', owner: 'PLAYERTWO' },
    });

    expect(GameRules.attackHasInRange(action, board)).toBe(false);
  });
});

describe('GameRules.resolveDead', () => {
  it('deve remover cartas mortas e dar victory point ao oponente', () => {
    const deadCard = makeCard({
      instanceId: 'dead-1',
      status: ['DEAD'],
      state: { currentLife: 0, currentAttack: 5, currentEnergy: 0, hasAttacked: true, isOnBoard: true, canEvolution: false },
    });
    const aliveCard = makeCard({
      instanceId: 'alive-1',
      status: [],
      state: { currentLife: 10, currentAttack: 3, currentEnergy: 0, hasAttacked: true, isOnBoard: true, canEvolution: false },
    });

    const room = makeRoom([]);
    room.state.board = makeBoard([
      { lane: 0, position: 'FRONT', owner: 'PLAYERONE', cardInstance: deadCard },
      { lane: 1, position: 'FRONT', owner: 'PLAYERONE', cardInstance: aliveCard },
    ]);

    GameRules.resolveDead(room);

    const slot0 = room.state.board.slots.find(
      (s) => s.lane === 0 && s.position === 'FRONT' && s.owner === 'PLAYERONE',
    );
    const slot1 = room.state.board.slots.find(
      (s) => s.lane === 1 && s.position === 'FRONT' && s.owner === 'PLAYERONE',
    );

    expect(slot0?.cardInstance).toBeUndefined();
    expect(room.state.playerTwo.victoryPoints).toBe(1);
    expect(room.state.playerTwo.graveyard).toContain('dead-1');

    expect(slot1?.cardInstance).toBeDefined();
    expect(slot1?.cardInstance?.state.hasAttacked).toBe(false);
  });

  it('deve lidar com múltiplas mortes', () => {
    const dead1 = makeCard({
      instanceId: 'dead-1',
      status: ['DEAD'],
      state: { currentLife: 0, currentAttack: 5, currentEnergy: 0, hasAttacked: true, isOnBoard: true, canEvolution: false },
    });
    const dead2 = makeCard({
      instanceId: 'dead-2',
      status: ['DEAD'],
      state: { currentLife: -3, currentAttack: 2, currentEnergy: 0, hasAttacked: false, isOnBoard: true, canEvolution: false },
    });

    const room = makeRoom([]);
    room.state.board = makeBoard([
      { lane: 0, position: 'FRONT', owner: 'PLAYERONE', cardInstance: dead1 },
      { lane: 1, position: 'FRONT', owner: 'PLAYERTWO', cardInstance: dead2 },
    ]);

    GameRules.resolveDead(room);

    expect(room.state.playerTwo.victoryPoints).toBe(1);
    expect(room.state.playerOne.victoryPoints).toBe(1);
    expect(room.state.playerTwo.graveyard).toContain('dead-1');
    expect(room.state.playerOne.graveyard).toContain('dead-2');
  });
});
