import { IsEmail, IsNotEmpty } from 'class-validator';

export class AutenticaDTO {
  @IsNotEmpty({ message: 'O login não pode estar vazio' })
  login: string;

  @IsNotEmpty({ message: 'A senha não pode estar vazia' })
  senha: string;
}
