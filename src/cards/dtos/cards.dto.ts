import { z } from 'zod';

const CARD_TYPES = ['SPELL', 'UNIT', 'EQUIP'] as const;

const EFFECT_TYPES = ['DAMAGE', 'HEAL', 'DRAW', 'BUFF', 'DEBUFF'] as const;

const TRIGGERS = ['START_TURN', 'END_TURN', 'ON_INVOCATION', 'ON_DIE'] as const;

const AbilitySchemaDto = z.object({
  trigger: z.enum(TRIGGERS),
  effect: z.string(),
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

  type: z.enum(CARD_TYPES),

  mana: z.number().min(0).default(0),

  class: z.string(),

  energy: z.number().nullable().optional(),
  attack: z.number().nullable().optional(),
  life: z.number().nullable().optional(),
  range: z.number().nullable().optional(),

  rarity: z.string().optional(),
  artUrl: z.string().url().optional(),
  description: z.string().optional(),

  effect: z
    .object({
      type: z.enum(EFFECT_TYPES).optional(),
      value: z.number().optional(),
    })
    .optional()
    .default({}),

  ability: AbilitySchemaDto.array().default([]),

  disabled: z.boolean().default(false),
});

export type CreateCardDto = z.infer<typeof CardDtoSchema>;

export const UpdateCardDtoSchema = CardDtoSchema.partial();
export type UpdateCardDto = z.infer<typeof UpdateCardDtoSchema>;
