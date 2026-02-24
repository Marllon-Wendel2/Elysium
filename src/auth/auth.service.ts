import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { HashingService } from 'src/infra/hashing/hashing.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private hashingService: HashingService,
  ) {}

  async login(loginDto: LoginDto) {
    // 1. Busca o usuário pelo email
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 2. Compara a senha enviada com o Hash do banco
    const isPasswordValid = await this.hashingService.comparePassword(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles as string[],
      firstName: user.firstName,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.firstName,
        roles: user.roles as string[],
        firstName: user.firstName,
      },
    };
  }
}
