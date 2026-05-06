import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WhatsappWebhookService } from './whatsapp_webhook.service';
import { RedisService } from '../redis/redis.service'; // Adjust the path as needed
import { PacienteService } from '../paciente/paciente.service'; // Adjust the path as needed
import { TurnoService } from '../turno/turno.service'; // Adjust the path as needed
import { UsuarioService } from '../usuario/usuario.service';

describe('WhatsappWebhookService', () => {
  let whatsappWebhookService: WhatsappWebhookService;
  let redisService: RedisService;
  let pacienteService: PacienteService;
  let turnoService: TurnoService;
  let usuarioService: UsuarioService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappWebhookService,
        {
          provide: PacienteService,
          useValue: {
            // Mock implementation of PacienteService methods if needed
            create: jest.fn(),
          },
        },
        {
          provide: TurnoService,
          useValue: {
            // Mock implementation of ConfiguracaoHorariosAvaliacaoService methods if needed
          },
        },
        {
          provide: UsuarioService,
          useValue: {
            // Mock implementation of ConfiguracaoHorariosAvaliacaoService methods if needed
          },
        },
        {
          provide: RedisService,
          useValue: {
            exists: jest.fn().mockResolvedValue(1),
            get: jest.fn().mockResolvedValue(1),
            set: jest.fn().mockResolvedValue(1),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'WHATSAPP_API_TOKEN' ? 'test-whatsapp-token' : undefined,
            ),
          },
        },
      ],
    }).compile();

    whatsappWebhookService = module.get<WhatsappWebhookService>(
      WhatsappWebhookService,
    );
    redisService = module.get<RedisService>(RedisService);
    pacienteService = module.get<PacienteService>(PacienteService);
    turnoService = module.get<TurnoService>(TurnoService);
    usuarioService = module.get<UsuarioService>(UsuarioService);
  });

  it('should be defined', () => {
    expect(whatsappWebhookService).toBeDefined();
  });

  it('Deve enviar mensagem de Resposta invalida quando usuario digitar um texto invalido', async () => {
    const postWhatsappMock = jest.spyOn(whatsappWebhookService, 'postWhatsapp').mockResolvedValue(undefined);

    const retorno: string = await whatsappWebhookService.enviarMensagemWhatsapp(
      'adriano',
      '554645445454',
      '54546454554545',
    );
    expect(postWhatsappMock).toHaveBeenCalledWith("54546454554545", retorno);
    expect(JSON.parse(retorno).text.body).toContain('Resposta invalida. Por Favor digite apenas o número da opção desejada')
  });

  it('Deve enviar mensagem ao nao concordar', async () => {
    const postWhatsappMock = jest.spyOn(whatsappWebhookService, 'postWhatsapp').mockResolvedValue(undefined);

    const retorno: string = await whatsappWebhookService.enviarMensagemWhatsapp(
      'nao_concorda',
      '554645445454',
      '54546454554545',
    );
    expect(postWhatsappMock).toHaveBeenCalledWith("54546454554545", retorno);
    expect(JSON.parse(retorno).text.body).toContain('A Reabi Clinic agradece seu contato. Sempre que precisar, é só digitar um Oi. 🌟')
  });

  it('Deve enviar mensagem ao concordar', async () => {
    const postWhatsappMock = jest.spyOn(whatsappWebhookService, 'postWhatsapp').mockResolvedValue(undefined);

    const retorno: string = await whatsappWebhookService.enviarMensagemWhatsapp(
      'concorda',
      '554645445454',
      '54546454554545',
    );
    expect(postWhatsappMock).toHaveBeenCalledWith("54546454554545", retorno);
    expect(JSON.parse(retorno).text.body).toContain(`Digite o número da opção desejada:`)
  });

});
