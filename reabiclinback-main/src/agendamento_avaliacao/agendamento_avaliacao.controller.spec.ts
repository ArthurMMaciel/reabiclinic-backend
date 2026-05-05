import { Test, TestingModule } from '@nestjs/testing';
import { AgendamentoAvaliacaoController } from './agendamento_avaliacao.controller';
import { AgendamentoAvaliacaoService } from './agendamento_avaliacao.service';

describe('AgendamentoAvaliacaoController', () => {
  let controller: AgendamentoAvaliacaoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgendamentoAvaliacaoController],
      providers: [AgendamentoAvaliacaoService],
    }).compile();

    controller = module.get<AgendamentoAvaliacaoController>(AgendamentoAvaliacaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
