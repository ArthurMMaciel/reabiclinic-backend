import { Test, TestingModule } from '@nestjs/testing';
import { AgendamentoAvaliacaoService } from './agendamento_avaliacao.service';

describe('AgendamentoAvaliacaoService', () => {
  let service: AgendamentoAvaliacaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgendamentoAvaliacaoService],
    }).compile();

    service = module.get<AgendamentoAvaliacaoService>(AgendamentoAvaliacaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
