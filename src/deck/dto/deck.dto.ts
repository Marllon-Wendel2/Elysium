import z from 'zod';

export const CreateDeckSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Nome do deck não pode ser vazio!' })
    .max(30, { message: 'Nome completo longo demais!' }),
  isSystem: z.boolean().default(false),
  cards: z
    .array(
      z.object({
        cardId: z.string(),
        quantity: z.number().int().positive().min(1).max(3),
      }),
    )
    .optional(),
});

export type CreateDeckDto = z.infer<typeof CreateDeckSchema>;

export const UpdateDeckSchema = CreateDeckSchema.partial();
export type UpdateDeckDto = z.infer<typeof UpdateDeckSchema>;
