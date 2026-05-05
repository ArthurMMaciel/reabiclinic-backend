import { PartialType } from '@nestjs/swagger';
import { CreateAgendamentoAvaliacaoDto } from './create-agendamento_avaliacao.dto';

export class UpdateAgendamentoAvaliacaoDto extends PartialType(CreateAgendamentoAvaliacaoDto) {}
