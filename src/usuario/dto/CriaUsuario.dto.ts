import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { EmailEhUnico } from '../validacao/email-eh-unico.validator';

export class CriaUsuarioDTO {
  @IsNotEmpty({ message: 'O login não pode ser vazio' })
  login: string;

  @IsNotEmpty({ message: 'O código não pode ser vazio' })
  codigo: string;

  @IsEmail(undefined, { message: 'O e-mail informado é inválido' })
  //@EmailEhUnico({ message: 'Já existe um usuário com este e-mail' })
  email: string;

  @MinLength(6, { message: 'A senha precisa ter pelo menos 6 caracteres' })
  senha: string;

  @IsNotEmpty({ message: 'O nome completo não pode ser vazio' })
  nomeCompleto: string;

  @IsOptional()
  especialidade: string;
}
