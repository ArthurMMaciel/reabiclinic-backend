import { IsNumber, IsString } from 'class-validator';

export class CreateTurnoDto {
  @IsNumber()
  id_profissional: number;

  @IsString()
  dia_semana: string;

  @IsString()
  hora_inicial: string;

  @IsString()
  hora_final: string;
}
