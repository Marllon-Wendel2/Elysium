import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Card } from './cards.type';
import { Model } from 'mongoose';
import { CreateCardDto } from './cards.dto';

@Injectable()
export class CardsService {
  constructor(@InjectModel('Card') private readonly cardModel: Model<Card>) {}

  async create(card: Card): Promise<Card> {
    const newCard = new this.cardModel(card);
    return newCard.save();
  }

  async createMultCards(cards: CreateCardDto[]): Promise<string> {
    try {
      await this.cardModel.insertMany(cards);
      return 'Cartas criadas com sucesso';
    } catch (error) {
      throw new InternalServerErrorException('Erro ao criar as cartas', error);
    }
  }

  async findAll(): Promise<Card[]> {
    return this.cardModel.find().exec();
  }
}
