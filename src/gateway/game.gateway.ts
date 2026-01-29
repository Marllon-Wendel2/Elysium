import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { PlayersService } from '../players/players.service';
import { RoomsService } from '../rooms/rooms.service';
import { GameService } from '../game/game.service';
import type { ClientToServerEvent } from './game.events';

@WebSocketGateway(3002, {
  cors: { origin: '*' },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly playersService: PlayersService,
    private readonly roomsService: RoomsService,
    private readonly gameService: GameService,
  ) {}

  handleConnection(socket: Socket) {
    this.playersService.register(socket);
  }

  handleDisconnect(socket: Socket) {
    this.playersService.unregister(socket.id);
  }

  @SubscribeMessage('GAME_ACTION')
  handleGameAction(
    @ConnectedSocket() socket: Socket,
    @MessageBody() action: ClientToServerEvent,
  ) {
    if (action.type === 'PING') {
      socket.emit('GAME_EVENT', { type: 'PONG' });
      return;
    }

    const player = this.playersService.getBySocket(socket.id);
    if (!player) return;

    this.gameService.processAction(player, action);
  }
}
