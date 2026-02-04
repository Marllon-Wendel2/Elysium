import { ServerGameState } from 'src/game/game.types';
export type PlayerSide = 'PLAYER ONE' | 'PLAYER TWO';

export class Room {
  constructor(
    public readonly id: string,
    public players: { player: PlayerSide; id: string }[],
    public state: ServerGameState,
    public status: 'WAITING' | 'PLAYING' | 'FINISHED' = 'WAITING',
  ) {}
}
