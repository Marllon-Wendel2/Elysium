import { ServerGameState } from 'src/game/game.types';

export class Room {
  constructor(
    public readonly id: string,
    public players: string[],
    public state: ServerGameState,
    public status: 'WAITING' | 'PLAYING' | 'FINISHED' = 'WAITING',
  ) {}
}
