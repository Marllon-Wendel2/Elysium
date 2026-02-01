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
    const player = this.playersService.register(socket);
    console.log(player);
  }

  handleDisconnect(socket: Socket) {
    this.playersService.unregister(socket.id);
    console.log(`Player ${socket.id} disconnected`);
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

  @SubscribeMessage('CREATE_ROOM')
  handleCreateRoom(@ConnectedSocket() socket: Socket) {
    const room = this.roomsService.createRoom({});
    const player = this.playersService.getBySocket(socket.id);
    if (!player) return;

    room.players.push(player.id);

    socket.emit('ROOM_CREATED', room);
  }

  @SubscribeMessage('JOIN_ROOM')
  handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() roomId: string,
  ) {
    const room = this.roomsService.get(roomId);
    console.log(room);
    if (!room) return;

    const player = this.playersService.getBySocket(socket.id);
    if (!player) return;

    room.players.push(player.id);
    socket.emit('ROOM_JOINED', room);
  }
}
