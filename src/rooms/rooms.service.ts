import { Inject, Injectable } from '@nestjs/common';
import { Room } from './room.entity';
import { randomUUID } from 'crypto';
import { initialState } from 'src/game/game.state';
import Redis from 'ioredis';

@Injectable()
export class RoomsService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}
  private rooms = new Map<string, Room>();

  async createRoom(playerId: string): Promise<Room> {
    const room = new Room(
      randomUUID(),
      [{ player: 'PLAYER ONE', id: playerId }],
      initialState,
      'WAITING',
    );
    this.rooms.set(room.id, room);
    await this.redis.set(
      `room:${room.id}`,
      JSON.stringify(room),
      'EX',
      60 * 60,
    );
    return room;
  }

  get(roomId: string) {
    return this.rooms.get(roomId);
  }
}
