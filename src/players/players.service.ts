import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Player } from './player.entity';
import Redis from 'ioredis';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { PlayerState } from 'src/game/game.types';

@Injectable()
export class PlayersService {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    private readonly prismaService: PrismaService,
  ) {}

  async register(player: Player) {
    await this.redis.set(
      `player:${player.id}`,
      JSON.stringify(player),
      'EX',
      60 * 60,
    );

    await this.redis.set(`socket:${player.socketId}`, player.id, 'EX', 60 * 60);
  }

  async unregister(socketId: string) {
    const playerId = await this.redis.get(`socket:${socketId}`);
    if (!playerId) return;

    await this.redis.del(`socket:${socketId}`);

    const data = await this.redis.get(`player:${playerId}`);
    if (!data) return;

    const player = JSON.parse(data);

    player.socketId = null;

    await this.redis.set(
      `player:${playerId}`,
      JSON.stringify(player),
      'EX',
      60 * 60,
    );
  }

  async getBySocket(socketId: string): Promise<Player | null> {
    const playerId = await this.redis.get(`socket:${socketId}`);
    if (!playerId) return null;

    return this.getById(playerId);
  }

  async getById(playerId: string): Promise<Player | null> {
    const data = await this.redis.get(`player:${playerId}`);
    if (!data) return null;

    try {
      const parsed = JSON.parse(data) as Record<string, unknown>;
      return Player.fromJSON(parsed);
    } catch (error) {
      console.error(
        'Erro ao parsear player do Redis:',
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  }

  async setRoom(playerId: string, roomId: string) {
    const data = await this.redis.get(`player:${playerId}`);
    if (!data) return;

    const player = JSON.parse(data);

    player.roomId = roomId;

    await this.redis.set(
      `player:${playerId}`,
      JSON.stringify(player),
      'EX',
      60 * 60,
    );
  }

  async findDeckById(playerId: string) {
    console.log('procurando deck do player: ', playerId);

    const deckSelect = await this.prismaService.user.findFirst({
      where: {
        id: playerId,
      },
      select: {
        playerProfile: {
          select: {
            selectedDeckId: true,
          },
        },
      },
    });

    console.log('deckSelect', deckSelect);

    if (!deckSelect) throw new NotFoundException('Deck não encontrado');

    return deckSelect.playerProfile?.selectedDeckId;
  }

  drawFirstOfType(player: PlayerState, type: string) {
    const index = player.deck.findIndex((card) => card.base.type === type);

    if (index === -1) return null;

    const [card] = player.deck.splice(index, 1);

    player.hand.push(card);

    return card;
  }
}
