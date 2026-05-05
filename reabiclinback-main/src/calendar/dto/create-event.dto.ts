import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateEventDto {
  @IsNotEmpty({ message: 'O nome não pode ser vazio' })
  nome: string;

  @IsEmail(undefined, { message: 'O e-mail informado é inválido' })
  // @EmailEhUnico({ message: 'Já existe um usuário com este e-mail' })
  email: string;
  @IsNotEmpty({ message: 'A data não pode ser vazia' })
  data: Date;
  @IsNotEmpty({ message: 'A hora não pode ser vazia' })
  hora: String;

  @IsEmail(undefined, { message: 'O calendar do e-mail informado é inválido' })
  // @EmailEhUnico({ message: 'Já existe um usuário com este e-mail' })
  calendarEmail: string;

  @IsNotEmpty({ message: 'O tipo de evento não pode ser vazio' })
  tipoEvento: String;
}
