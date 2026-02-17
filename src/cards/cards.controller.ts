import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './cards.dto';
import type { UpdateCardDto } from './cards.dto';

@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  async createMultCard(@Body() createCardDto: CreateCardDto[]) {
    return await this.cardsService.createMultCards(createCardDto);
  }

  @Get()
  async findCardAll() {
    return this.cardsService.findCardAll();
  }

  @Get(':id')
  async findCardById(@Param('id') id: string) {
    return this.cardsService.findCardById(id);
  }

  @Get('name/:name')
  async findCardByName(@Param('name') name: string) {
    return this.cardsService.findCardByName(name);
  }

  @Patch(':id')
  async updateCard(
    @Body() updateCardDto: UpdateCardDto,
    @Param('id') id: string,
  ) {
    return this.cardsService.updateCard(id, updateCardDto);
  }

  @Delete(':id')
  async deleteCard(@Param('id') id: string) {
    return this.cardsService.deleteCard(id);
  }
}
