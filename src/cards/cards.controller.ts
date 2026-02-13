import { Body, Controller, Post } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './cards.dto';

@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  async createMultCard(@Body() createCardDto: CreateCardDto[]) {
    return this.cardsService.createMultCards(createCardDto);
  }
}
