import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { HashingService } from 'src/infra/hashing/hashing.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly hashingService: HashingService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    try {
      const existUser = await this.prismaService.user.findUnique({
        where: {
          email: createUserDto.email,
        },
      });

      if (existUser) {
        throw new ConflictException('Usuário já existe');
      }

      const { password, ...userData } = createUserDto;

      const hashedPassword = await this.hashingService.hashPassword(password);

      const user = await this.prismaService.user.create({
        data: {
          ...userData,
          passwordHash: hashedPassword,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return user;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Consulte o log do servidor');
    }
  }

  async findAllUsers() {
    try {
      const users = await this.prismaService.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      if (!users) {
        throw new ConflictException('Nenhum usuário encontrado');
      }

      return users;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Consulte o log do servidor');
    }
  }

  async findUserById(id: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      return user;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Consulte o log do servidor');
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      const { password, ...userData } = updateUserDto;

      if (password) {
        throw new ConflictException('Não é possível atualizar a senha');
      }

      const updatedUser = await this.prismaService.user.update({
        where: { id },
        data: {
          ...userData,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return updatedUser;
    } catch (error) {
      console.error(error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Consulte o log do servidor');
    }
  }

  async removeUser(id: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      await this.prismaService.user.delete({
        where: { id },
      });

      return { message: 'Usuário removido com sucesso' };
    } catch (error) {
      console.error(error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Consulte o log do servidor');
    }
  }
}
