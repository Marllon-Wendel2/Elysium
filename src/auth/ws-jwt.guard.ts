import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Pega o cliente socket
    const client: Socket = context.switchToWs().getClient();

    // 2. Extrai o token (pode vir do Header ou Handshake Auth)
    const token = this.extractToken(client);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      // 3. Verifica o token e anexa o user ao socket para uso posterior
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      // Anexa o usuário ao objeto client para acessar nos métodos do Gateway
      client['user'] = payload;

      return true;
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }

  private extractToken(client: Socket): string | undefined {
    // Tenta pegar do handshake (auth: { token: '...' }) - Padrão do Socket.io v4
    const authHeader =
      client.handshake.auth.token || client.handshake.headers.authorization;

    if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
      return authHeader.split(' ')[1];
    }
    return authHeader; // Caso envie apenas o token direto
  }
}
