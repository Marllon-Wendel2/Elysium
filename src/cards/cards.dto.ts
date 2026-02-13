import { z } from 'zod';

const CARD_CLASSES = ['spell', 'unit', 'equip'] as const;

const EFFECT_TYPES = ['DAMAGE', 'HEAL', 'DRAW', 'BUFF', 'DEBUFF'] as const;

export const CardDtoSchema = z.object({
  name: z.string().min(1, { message: 'Nome não pode ser vazio' }),
  mana: z.number().min(0).default(0),
  class: z.enum(CARD_CLASSES),
  energy: z.number().nullable().optional(),
  attack: z.number().nullable().optional(),
  life: z.number().nullable().optional(),
  range: z.number().nullable().optional(),

  rarity: z.string().optional(),
  artUrl: z.string().url().optional(),

  effect: z
    .object({
      type: z.enum(EFFECT_TYPES).optional(),
      value: z.number().optional(),
    })
    .optional()
    .default({}),

  description: z.string().optional(),
});

export type CreateCardDto = z.infer<typeof CardDtoSchema>;
