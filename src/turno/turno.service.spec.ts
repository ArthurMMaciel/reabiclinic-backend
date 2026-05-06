import { Test, TestingModule } from '@nestjs/testing';
import { TurnoService } from './turno.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Turno } from './entities/turno.entity';
import { Repository } from 'typeorm';

describe('TurnoService', () => {
  let service: TurnoService;
  let turnoRepository: Repository<Turno>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TurnoService, {
        provide: getRepositoryToken(Turno),
        useValue: {
          save: jest.fn(),
          find: jest.fn(),
          findOneBy: jest.fn()
        }
      }],
    }).compile();

    service = module.get<TurnoService>(TurnoService);
    turnoRepository = module.get<Repository<Turno>>(
      getRepositoryToken(Turno)
    )
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
