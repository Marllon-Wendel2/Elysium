import { Player } from '../players/player.entity';
import type { ServerGameState } from '../game/game.state';

export class Room {
  constructor(
    public readonly id: string,
    public players: Player[],
    public state: ServerGameState,
    public status: 'WAITING' | 'PLAYING' | 'FINISHED' = 'WAITING',
  ) {}
}
