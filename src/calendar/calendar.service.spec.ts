import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CalendarService } from './calendar.service';
import { UsuarioService } from '../usuario/usuario.service';

describe('CalendarService', () => {
  let service: CalendarService;

  const mockConfig = {
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        CLIENT_ID: 'test-client',
        CLIENT_SECRET: 'test-secret',
        URL_AMBIENTE: 'http://localhost:3000',
        REDIRECT_URI: 'http://localhost:3000/oauth2callback',
        CALENDAR_OAUTH_REDIRECT_URI:
          'http://localhost:3000/calendar/oauth2callback',
      };
      return map[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: UsuarioService, useValue: {} },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
