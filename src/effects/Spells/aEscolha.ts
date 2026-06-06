import { Room } from 'src/rooms/room.entity';

// eslint-disable-next-line @typescript-eslint/require-await
export async function aEscolha(room: Room, context: EffectContext) {
  console.log(
    `A magia A escolha foi utilizada em: ${JSON.stringify(context.sourceCard)}`,
  );
  return true;
}
