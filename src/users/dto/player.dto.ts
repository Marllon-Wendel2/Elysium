import { z } from 'zod';

export const createPlayerSchema = z.object({
  username: z
    .string({
      error: 'O username é obrigatório.',
    })
    .min(3, 'O username deve ter pelo menos 3 caracteres.')
    .max(20, 'O username não pode ter mais de 20 caracteres.')
    // Essa regex garante que o cara não coloque espaços ou caracteres especiais malucos no nick
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'O username só pode conter letras, números e underlines (_).',
    ),
});

export type CreatePlayerDto = z.infer<typeof createPlayerSchema>;
