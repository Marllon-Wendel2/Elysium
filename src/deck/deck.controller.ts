import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { DeckService } from './deck.service';
import * as deckDto from './dto/deck.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import { CreateDeckSchema } from './dto/deck.dto';

@Controller('deck')
export class DeckController {
  constructor(private readonly deckService: DeckService) {}

  @Post()
  createDeck(
    @Body(new ZodValidationPipe(CreateDeckSchema))
    dto: deckDto.CreateDeckDto,
  ) {
    return this.deckService.createDeck(dto);
  }

  @Get()
  findAllSystemDecks() {
    return this.deckService.findAllSystemDecks();
  }

  @Get(':deckId')
  findDeckById(@Param('deckId') deckId: string) {
    return this.deckService.findDeckById(deckId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deckService.remove(+id);
  }
}
