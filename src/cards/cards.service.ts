import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Card } from './cards.type';
import { Model } from 'mongoose';
import { CreateCardDto, UpdateCardDto } from './cards.dto';

@Injectable()
export class CardsService {
  constructor(@InjectModel('Card') private readonly cardModel: Model<Card>) {}

  async create(card: Card): Promise<Card> {
    const newCard = new this.cardModel(card);
    return newCard.save();
  }

  async createMultCards(cards: CreateCardDto[]): Promise<string> {
    const names = cards.map((card) => card.name);
    const existingCards = await this.cardModel.find({ name: { $in: names } });

    if (existingCards.length > 0) {
      const existingNames = existingCards.map((card) => card.name).join(', ');
      throw new ConflictException(
        `As seguintes cartas já existem: ${existingNames}`,
      );
    }

    try {
      await this.cardModel.insertMany(cards);
      return 'Cartas criadas com sucesso';
    } catch (error) {
      throw new InternalServerErrorException('Erro ao criar as cartas', error);
    }
  }

  async findCardAll(): Promise<Card[]> {
    return this.cardModel.find().limit(10).exec();
  }

  async findCardById(id: string) {
    try {
      const cardFound = await this.cardModel.findById(id);

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
      const cardFound = await this.cardModel.find({
        name: { $regex: nameFormated, $options: 'i' },
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
      const updateCard = await this.cardModel.findByIdAndUpdate(id, card, {
        new: true,
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
      return await this.cardModel.findByIdAndUpdate(
        id,
        {
          disabled: true,
        },
        {
          new: true,
        },
      );
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Consulte o console');
    }
  }
}
