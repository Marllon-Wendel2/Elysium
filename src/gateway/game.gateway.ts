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
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/infra/types';

type AuthenticatedSocket = Socket & {
  user?: { sub: string; email: string; roles: string; firstName: string };
};

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
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(socket: AuthenticatedSocket) {
    try {
      const token: string = (socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization) as string;
      if (!token) {
        throw new UnauthorizedException('Token não fornecido');
      }

      const jwt = token.replace('Bearer ', '');

      const payload = await this.jwtService.verifyAsync<JwtPayload>(jwt, {
        secret: process.env.JWT_SECRET,
      });

      console.log(payload);

      socket.user = payload;
      this.playersService.register(socket.id, payload.sub, payload.firstName);

      console.log(
        `[CONEXÃO] Usuário ${payload.email} entrou com Socket ID: ${socket.id}`,
      );
    } catch (error) {
      console.log(`[BLOQUEIO] Conexão rejeitada: ${error}`);

      socket.disconnect(true);
    }
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
  async handleCreateRoom(@ConnectedSocket() socket: AuthenticatedSocket) {
    console.log('chegou aqui');

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
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() roomId: string,
  ) {
    const player = this.playersService.getBySocket(socket.id);
    if (!player) throw new NotFoundException('Player not found');

    const result = await this.roomsService.joinRoom(roomId, player.id);
    if (!result) throw new NotFoundException('Room not found');

    console.log(result);

    if ('error' in result) {
      socket.emit('ERROR', result.error);
      return;
    }

    await socket.join(roomId);

    socket.emit('ROOM_JOINED');

    if (result.ready) {
      console.log('entrou no if');
      const room = result.room;
      console.log('room', room);

      const p1Id = room.players.find((p) => p.player === 'PLAYER ONE')?.id;
      const p2Id = room.players.find((p) => p.player === 'PLAYER TWO')?.id;

      console.log('p1Id', p1Id);
      console.log('p2Id', p2Id);

      if (!p1Id || !p2Id) return;

      const playerOne = this.playersService.getById(p1Id);
      const playerTwo = this.playersService.getById(p2Id);

      if (!playerOne || !playerTwo) return;
      console.log('playerOne', playerOne);
      console.log('playerTwo', playerTwo);

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
