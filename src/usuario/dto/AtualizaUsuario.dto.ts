import { IsEmail, IsOptional } from 'class-validator';

export class AtualizaUsuarioDTO {
  @IsOptional()
  login?: string;

  @IsOptional()
  @IsEmail(undefined, { message: 'O e-mail informado é inválido' })
  //@EmailEhUnico({ message: 'Já existe um usuário com este e-mail' })
  email?: string;

  @IsOptional()
  ativo?: boolean;

  @IsOptional()
  calendarToken?: string;

  @IsOptional()
  nomeCompleto?: string;

  @IsOptional()
  especialidade?: string;

}
