import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { Card } from '@prisma/client';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateCardDto, UpdateCardDto } from './cards.dto';

@Injectable()
export class CardsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(card: CreateCardDto): Promise<Card> {
    console.log(card);
    return this.prismaService.card.create({ data: card });
  }

  async createMultCards(cards: CreateCardDto[]): Promise<string> {
    const names = cards.map((card) => card.name);
    const existingCards = await this.prismaService.card.findMany({
      where: { name: { in: names } },
    });

    if (existingCards.length > 0) {
      const existingNames = existingCards.map((card) => card.name).join(', ');
      throw new ConflictException(
        `As seguintes cartas já existem: ${existingNames}`,
      );
    }

    try {
      await this.prismaService.card.createMany({ data: cards });
      return 'Cartas criadas com sucesso';
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao criar as cartas',
        error as Error,
      );
    }
  }

  async findCardAll(): Promise<Card[]> {
    return this.prismaService.card.findMany({ take: 10 });
  }

  async findCardById(id: string) {
    try {
      const cardFound = await this.prismaService.card.findFirst({
        where: { id },
      });

      if (!cardFound) throw new NotFoundException('Card not found');

      return cardFound;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Consulte o console');
    }
  }

  async findCardByName(name: string): Promise<Card[]> {
    try {
      const nameFormated = name.replace('---', ' ');
      const cardFound = await this.prismaService.card.findMany({
        where: {
          name: { contains: nameFormated, mode: 'insensitive' },
        },
      });

      if (!cardFound) throw new NotFoundException('Card not found');

      return cardFound;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Consulte o console');
    }
  }

  async updateCard(id: string, card: UpdateCardDto) {
    try {
      const updateCard = await this.prismaService.card.update({
        where: { id },
        data: card,
      });

      if (!updateCard) throw new NotFoundException('Card not found');
      return updateCard;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Consulte o console');
    }
  }

  async deleteCard(id: string) {
    try {
      return await this.prismaService.card.update({
        where: { id },
        data: { disabled: true },
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Consulte o console');
    }
  }
}
