import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const CreateUserSchema = z.object({
  firstName: z
    .string({ error: 'O nome deve ser um texto' })
    .min(1, 'O nome é obrigatório'), // O .min(1) é a forma mais segura de garantir que não venha string vazia

  lastName: z.string().optional(),

  email: z
    .string()
    .min(1, 'O email é obrigatório')
    .email('Formato de email inválido'),

  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}

const UpdateSchema = CreateUserSchema.partial();

export class UpdateUserDto extends createZodDto(UpdateSchema) {}
