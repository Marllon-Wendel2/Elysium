import { z } from 'zod';

const CARD_CLASSES = ['spell', 'unit', 'equip'] as const;

const EFFECT_TYPES = ['DAMAGE', 'HEAL', 'DRAW', 'BUFF', 'DEBUFF'] as const;

const AbilitySchemaDto = z.object({
  trigger: z.enum(['START_TURN', 'END_TURN']),
  effect: z.enum(['CREATE', 'APPLYSTATUS']),
  params: z
    .object({
      cardId: z.string().optional(),
      zone: z.string().optional(),
      status: z.string().optional(),
      value: z.number().optional(),
    })
    .optional(),
});

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
  ability: AbilitySchemaDto.array().optional(),
  description: z.string().optional(),
  disable: z.boolean().default(false),
});

export type CreateCardDto = z.infer<typeof CardDtoSchema>;

const UpdateSchema = CardDtoSchema.partial();

export type UpdateCardDto = z.infer<typeof UpdateSchema>;
