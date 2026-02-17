import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'O email é obrigatório')
    .email('Formato de email inválido'),
  password: z.string().min(1, 'Digite a senha!'),
});

export class LoginDto extends createZodDto(LoginSchema) {}
