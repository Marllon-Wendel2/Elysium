import { Injectable } from '@nestjs/common';
import { Player } from './player.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class PlayersService {
  private players = new Map<string, Player>();

  register(socket: { id: string }) {
    const player = new Player(randomUUID(), socket.id);
    this.players.set(socket.id, player);
    return player;
  }

  unregister(socketId: string) {
    this.players.delete(socketId);
  }

  getBySocket(socketId: string) {
    return this.players.get(socketId);
  }
}
