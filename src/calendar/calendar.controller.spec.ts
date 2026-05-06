import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CalendarController } from './calendar.controller';
import { UsuarioService } from '../usuario/usuario.service';

describe('CalendarController', () => {
  let controller: CalendarController;

  const mockConfig = {
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        CLIENT_ID: 'test-client',
        CLIENT_SECRET: 'test-secret',
        URL_AMBIENTE: 'http://localhost:3000',
        REDIRECT_URI: 'http://localhost:3000/oauth2callback',
      };
      return map[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarController],
      providers: [
        { provide: ConfigService, useValue: mockConfig },
        { provide: UsuarioService, useValue: {} },
      ],
    }).compile();

    controller = module.get<CalendarController>(CalendarController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
