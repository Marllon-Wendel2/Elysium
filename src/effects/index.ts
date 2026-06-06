import { arthurEscolhido } from './arthurEscolhido';
import { aEscolha } from './Spells/aEscolha';
import { Room } from 'src/rooms/room.entity';

export const effectHandlers: Record<
  string,
  (room: Room, context: EffectContext) => Promise<boolean>
> = {
  arthurEscolhido,
  aEscolha,
};
