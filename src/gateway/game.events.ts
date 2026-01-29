export type ClientToServerEvent =
  | { type: 'PLAY_CARD'; cardId: string; slotId: string }
  | { type: 'END_TURN' }
  | {
      type: 'DECLARE_EFFECT_INTENT';
      cardInstanceId: string;
      effectKey?: string;
    }
  | { type: 'PING' };

export type ServerToClientEvent =
  | { type: 'GAME_SYNC'; state: any }
  | { type: 'ERROR'; message: string }
  | { type: 'PONG' };
