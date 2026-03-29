import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateDeckDto } from './dto/deck.dto';

@Injectable()
export class DeckService {
  constructor(private readonly prismaService: PrismaService) {}
  async createDeck(createDeckDto: CreateDeckDto) {
    try {
      const deck = await this.prismaService.deck.create({
        data: {
          name: createDeckDto.name,
          isSystem: createDeckDto.isSystem,
          cards: createDeckDto.cards
            ? {
                create: createDeckDto.cards.map((card) => ({
                  cardId: card.cardId,
                  quantity: card.quantity,
                })),
              }
            : {
                create: [],
              },
        },
        include: {
          cards: {
            include: {
              card: true,
            },
          },
        },
      });
      return deck;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Erro ao criar o deck');
    }
  }

  async findAllSystemDecks() {
    try {
      const systemsDecks = await this.prismaService.deck.findMany({
        where: {
          isSystem: true,
        },
      });

      if (systemsDecks.length <= 0)
        throw new NotFoundException('Nenhum deck encontrado');

      return systemsDecks;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Erro ao buscar os decks');
    }
  }

  async findDeckById(deckId: string) {
    try {
      const deck = await this.prismaService.deck.findUnique({
        where: {
          id: deckId,
        },
        include: {
          cards: {
            include: {
              card: true,
            },
          },
        },
      });

      if (!deck) throw new NotFoundException('Deck não encontrado');

      return deck;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Erro ao buscar o deck');
    }
  }

  // update(id: number, updateDeckDto: UpdateDeckDto) {
  //   return `This action updates a #${id} deck`;
  // }

  remove(id: number) {
    return `This action removes a #${id} deck`;
  }
}
