export interface ServerGameState {
  turn: number;
  currentPlayerId: string;
  players: Record<string, any>;
  board: any;
  rngSeed: number;
}
