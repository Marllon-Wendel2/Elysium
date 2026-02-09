import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PlayersService } from '../players/players.service';
import { RoomsService } from '../rooms/rooms.service';
import { GameService } from '../game/game.service';
import { NotFoundException } from '@nestjs/common';

@WebSocketGateway(3002, {
  cors: { origin: '*' },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

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

  // @SubscribeMessage('GAME_ACTION')
  // handleGameAction(
  //   @ConnectedSocket() socket: Socket,
  //   @MessageBody() action: ClientToServerEvent,
  // ) {
  //   if (action.type === 'PING') {
  //     socket.emit('GAME_EVENT', { type: 'PONG' });
  //     return;
  //   }

  //   const player = this.playersService.getBySocket(socket.id);
  //   if (!player) return;

  //   this.gameService.processAction(player, action);
  // }

  @SubscribeMessage('CREATE_ROOM')
  async handleCreateRoom(@ConnectedSocket() socket: Socket) {
    const player = this.playersService.getBySocket(socket.id);
    if (!player) return;

    const roomString = await this.roomsService.createRoom(player.id);

    void socket.join(roomString);
    player.roomId = roomString;
    console.log(player);

    socket.emit('ROOM_CREATED', roomString);
  }

  @SubscribeMessage('JOIN_ROOM')
  async handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() roomId: string,
  ) {
    const player = this.playersService.getBySocket(socket.id);
    if (!player) throw new NotFoundException('Player not found');

    const result = await this.roomsService.joinRoom(roomId, player.id);
    if (!result) throw new NotFoundException('Room not found');

    if ('error' in result) {
      socket.emit('ERROR', result.error);
      return;
    }

    await socket.join(roomId);

    socket.emit('ROOM_JOINED');

    if (result.ready) {
      const room = result.room;

      const p1Id = room.players.find((p) => p.player === 'PLAYER ONE')?.id;
      const p2Id = room.players.find((p) => p.player === 'PLAYER TWO')?.id;

      if (!p1Id || !p2Id) return;

      const playerOne = this.playersService.getById(p1Id);
      const playerTwo = this.playersService.getById(p2Id);

      if (!playerOne || !playerTwo) return;

      this.server.to(playerOne.socketId).emit('SLOT_CHOICE');
      this.server.to(playerTwo.socketId).emit('SLOT_CHOICE');

      // const viewP1 = this.gameService.createPlayerView(room.state, 'PLAYERONE');
      // const viewP2 = this.gameService.createPlayerView(room.state, 'PLAYERTWO');

      //   this.server.to(playerOne.socketId).emit('GAME_STATE', viewP1);
      //   this.server.to(playerTwo.socketId).emit('GAME_STATE', viewP2);
    }
  }

  @SubscribeMessage('SUBMIT_SLOTS')
  async handleSlotChoice(
    @ConnectedSocket() socket: Socket,
    @MessageBody() slots: { front: number; back: number },
  ) {
    const player = this.playersService.getBySocket(socket.id);
    if (!player) return;

    const room = await this.roomsService.get(player.roomId!);
    if (!room) return;

    const result = await this.gameService.submitSlotChoice(
      room,
      player.id,
      slots,
    );

    if (!result.ok) {
      socket.emit('SETUP_ERROR', result.error);
      return;
    }

    socket.emit('SLOTS_CONFIRMED');

    if (result.ready) {
      this.server.to(room.id).emit('SETUP_FINISHED');
    }
  }
}
