import { Module } from '@nestjs/common';
import { AgendamentoAvaliacaoService } from './agendamento_avaliacao.service';
import { AgendamentoAvaliacaoController } from './agendamento_avaliacao.controller';

@Module({
  controllers: [AgendamentoAvaliacaoController],
  providers: [AgendamentoAvaliacaoService],
})
export class AgendamentoAvaliacaoModule {}
