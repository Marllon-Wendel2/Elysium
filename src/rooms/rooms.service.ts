import { Inject, Injectable } from '@nestjs/common';
import { Room } from './room.entity';
import { randomUUID } from 'crypto';
import { initialState } from 'src/game/game.state';
import Redis from 'ioredis';
import { PlayersService } from 'src/players/players.service';

type JoinRoomResult =
  | { error: 'ROOM_FULL' }
  | {
      room: Room;
      ready: boolean;
    };

@Injectable()
export class RoomsService {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    private readonly playersService: PlayersService,
  ) {}

  async createRoom(playerId: string): Promise<string> {
    const room = new Room(
      randomUUID(),
      [{ player: 'PLAYER ONE', id: playerId }],
      initialState,
      'WAITING',
    );

    await this.redis.set(
      `room:${room.id}`,
      JSON.stringify(room),
      'EX',
      60 * 60,
    );

    return room.id;
  }

  async get(roomId: string): Promise<Room | null> {
    const data = await this.redis.get(`room:${roomId}`);
    if (!data) return null;

    return JSON.parse(data) as Room;
  }

  async updateRoom(room: Room): Promise<void> {
    await this.redis.set(
      `room:${room.id}`,
      JSON.stringify(room),
      'EX',
      60 * 60,
    );
  }

  async joinRoom(
    roomId: string,
    playerId: string,
  ): Promise<JoinRoomResult | null> {
    const room = await this.get(roomId);
    if (!room) return null;

    if (room.players.length >= 2) {
      return { error: 'ROOM_FULL' };
    }

    room.players.push({ player: 'PLAYER TWO', id: playerId });

    const player = await this.playersService.getById(playerId);
    if (player) {
      player.roomId = roomId;
    }

    await this.updateRoom(room);

    const ready = room.players.length === 2;

    if (ready) {
      room.status = 'PLAYING';
      room.state.turn = 1;
      room.state.phase = 'SETUP';

      await this.updateRoom(room);
    }

    return {
      room,
      ready,
    };
  }
}
