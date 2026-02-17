import { Injectable } from '@nestjs/common';
import { Player } from './player.entity';

@Injectable()
export class PlayersService {
  private players = new Map<string, Player>();

  register(socketId: string, userId: string, name: string) {
    const player = new Player(userId, socketId, undefined, name);

    this.players.set(socketId, player);
    return player;
  }

  unregister(socketId: string) {
    this.players.delete(socketId);
  }

  getBySocket(socketId: string) {
    return this.players.get(socketId);
  }

  getById(playerId: string): Player | undefined {
    for (const player of this.players.values()) {
      if (player.id === playerId) {
        return player;
      }
    }
    return undefined;
  }
}
