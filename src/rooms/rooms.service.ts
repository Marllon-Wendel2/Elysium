import { Injectable } from '@nestjs/common';
import { Room } from './room.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class RoomsService {
  private rooms = new Map<string, Room>();

  createRoom(initialState: any): Room {
    const room = new Room(randomUUID(), [], initialState);
    this.rooms.set(room.id, room);
    return room;
  }

  get(roomId: string) {
    return this.rooms.get(roomId);
  }
}
