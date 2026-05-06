import { Injectable } from '@nestjs/common';
import { CreateAgendamentoAvaliacaoDto } from './dto/create-agendamento_avaliacao.dto';
import { UpdateAgendamentoAvaliacaoDto } from './dto/update-agendamento_avaliacao.dto';

@Injectable()
export class AgendamentoAvaliacaoService {
  create(createAgendamentoAvaliacaoDto: CreateAgendamentoAvaliacaoDto) {
    return 'This action adds a new agendamentoAvaliacao';
  }

  findAll() {
    return `This action returns all agendamentoAvaliacao`;
  }

  findOne(id: number) {
    return `This action returns a #${id} agendamentoAvaliacao`;
  }

  update(id: number, updateAgendamentoAvaliacaoDto: UpdateAgendamentoAvaliacaoDto) {
    return `This action updates a #${id} agendamentoAvaliacao`;
  }

  remove(id: number) {
    return `This action removes a #${id} agendamentoAvaliacao`;
  }
}
