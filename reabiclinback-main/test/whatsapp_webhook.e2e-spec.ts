import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';
import { DataSource } from 'typeorm';
import { HashearSenhaPipe } from '../src/utils/pipes/hashear-senha.pipe';
import { INestApplication } from '@nestjs/common';
import { UsuarioEntity } from '../src/usuario/entities/usuario.entity';
import { WhatsappWebhookService } from '../src/whatsapp_webhook/whatsapp_webhook.service';
import { RedisService } from '../src/redis/redis.service';
import { PacienteService } from '../src/paciente/paciente.service';
import { TurnoService } from '../src/turno/turno.service';
import { UsuarioService } from '../src/usuario/usuario.service';
import { createClient } from 'redis';
import { Turno } from '../src/turno/entities/turno.entity';

jest.setTimeout(50000);

describe('AppModule Integration Tests', () => {
  let whatsappWebhookService: WhatsappWebhookService;
  let redisService: RedisService;
  let turnoService: TurnoService;
  let usuarioService: UsuarioService;
  let app: INestApplication;
  let pipe: HashearSenhaPipe;
  let postgresContainer;
  let redisContainer;
  let dataSource: DataSource;

  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer()
      .withDatabase('teste')
      .withUsername('postgres')
      .withExposedPorts(5432)
      .start();

    process.env.DB_HOST = postgresContainer.getHost();
    process.env.DB_USERNAME = postgresContainer.getUsername();
    process.env.DB_PASSWORD = postgresContainer.getPassword();
    process.env.DB_NAME = postgresContainer.getDatabase();
    process.env.DB_PORT = postgresContainer.getMappedPort(5432);
    process.env.SAL_SENHA = '$2b$10$J52/4mc8wZxRzuvoVOpu2.';
    process.env.SEGREDO_JWT = 'SEGREDO_TESTE';

    redisContainer = await new RedisContainer().withExposedPorts(6379).start();

    // Obtenha a porta mapeada do contêiner
    const redisPort = redisContainer.getMappedPort(6379);

    // Exiba a porta mapeada
    console.log(`Porta mapeada do Redis: ${redisPort}`);

    process.env.REDIS_HOST = redisContainer.getHost();
    process.env.REDIS_PORT = String(redisPort);

    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [UsuarioEntity, Turno],
      synchronize: true,
      logging: 'all',
      logger: 'advanced-console',
    });
    await dataSource.initialize();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappWebhookService,
        RedisService,
        PacienteService,
        TurnoService,
        UsuarioService,
        {
          provide: 'TurnoRepository',
          useValue: {
            // Aqui você pode adicionar mocks dos métodos do TurnoRepository conforme necessário
          },
        },
        {
          provide: 'UsuarioEntityRepository',
          useValue: {},
        },
      ],
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    pipe = moduleFixture.get<HashearSenhaPipe>(HashearSenhaPipe);
    whatsappWebhookService = moduleFixture.get<WhatsappWebhookService>(
      WhatsappWebhookService,
    );
    redisService = moduleFixture.get<RedisService>(RedisService);
    turnoService = moduleFixture.get<TurnoService>(TurnoService);
    usuarioService = moduleFixture.get<UsuarioService>(UsuarioService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await postgresContainer.stop();
    await redisContainer.stop();
  });

  beforeEach(async () => {
    redisService.del('user:5546945445454:choices');
    usuarioService.deletaUsuario('1');
    turnoService.remove(1);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('Deve retornar mensagem ao não concordar', async () => {
    jest
      .spyOn(whatsappWebhookService, 'postWhatsapp')
      .mockResolvedValue(undefined);

    await whatsappWebhookService.enviarMensagemWhatsapp(
      'nao_concorda',
      '554645445454',
      '54546454554545',
    );

    const usuarioEscolha = await redisService.get('user:5546945445454:choices');
    expect(usuarioEscolha).toBeNull();
  });

  it('Deve enviar mensagem para o whatsapp', async () => {
    jest
      .spyOn(whatsappWebhookService, 'postWhatsapp')
      .mockResolvedValue(undefined);

    await whatsappWebhookService.enviarMensagemWhatsapp(
      'concorda',
      '554645445454',
      '54546454554545',
    );

    const usuarioEscolha = await redisService.get('user:5546945445454:choices');
    expect(usuarioEscolha).toMatchObject({ consentimento: true });
  });

  it('Deve retornar menu se tentar agendar aula com Turnos vazios', async () => {
    jest
      .spyOn(whatsappWebhookService, 'postWhatsapp')
      .mockResolvedValue(undefined);

    await whatsappWebhookService.enviarMensagemWhatsapp(
      'concorda',
      '554645445454',
      '54546454554545',
    );

    await whatsappWebhookService.enviarMensagemWhatsapp(
      '1',
      '554645445454',
      '54546454554545',
    );

    //  await new Promise((resolve) => setTimeout(resolve, 100));
    const usuarioEscolha = await redisService.get('user:5546945445454:choices');
    expect(usuarioEscolha).toMatchObject({ consentimento: true });
  });

  it('Deve agendar aula', async () => {
    await usuarioService.criaUsuario({
      login: "teste",
      email: "teste@gmail.com",
      senha: "teste!@#",
      nomeCompleto: "testedasilva",
      especialidade: "teste",
      codigo: '1',
    })
    await turnoService.create({
      id_profissional: 1,
      dia_semana: 'Segunda',
      hora_inicial: '14:00',
      hora_final: '17:00',
    });

    jest
      .spyOn(whatsappWebhookService, 'postWhatsapp')
      .mockResolvedValue(undefined);

    await whatsappWebhookService.enviarMensagemWhatsapp(
      'concorda',
      '554645445454',
      '54546454554545',
    );
    await whatsappWebhookService.enviarMensagemWhatsapp(
      '1',
      '554645445454',
      '54546454554545',
    );

    //  await new Promise((resolve) => setTimeout(resolve, 100));
    const usuarioEscolha = await redisService.get('user:5546945445454:choices');
    expect(usuarioEscolha).toMatchObject({
      consentimento: true,
      opcao_desejada: "1",
    });
  });

  it('Deve escolher profissional', async () => {
    await usuarioService.criaUsuario({
      login: "teste",
      email: "teste@gmail.com",
      senha: "teste!@#",
      nomeCompleto: "testedasilva",
      especialidade: "teste",
      codigo: '1',
    })
    await turnoService.create({
      id_profissional: 1,
      dia_semana: 'Segunda',
      hora_inicial: '14:00',
      hora_final: '17:00',
    });

    jest
      .spyOn(whatsappWebhookService, 'postWhatsapp')
      .mockResolvedValue(undefined);

    jest
      .spyOn(whatsappWebhookService, 'enviarMensagemSemTurnosDisponiveis')
      .mockResolvedValue(undefined);

    await whatsappWebhookService.enviarMensagemWhatsapp(
      'concorda',
      '554645445454',
      '54546454554545',
    );
    await whatsappWebhookService.enviarMensagemWhatsapp(
      '1',
      '554645445454',
      '54546454554545',
    );

    await whatsappWebhookService.enviarMensagemWhatsapp(
      '1',
      '554645445454',
      '54546454554545',
    );

    //  await new Promise((resolve) => setTimeout(resolve, 100));
    const usuarioEscolha = await redisService.get('user:5546945445454:choices');
    expect(usuarioEscolha).toMatchObject({
      consentimento: true,
      opcao_desejada: "1",
      profissionalEscolhido: "1",
    });
  });
});
