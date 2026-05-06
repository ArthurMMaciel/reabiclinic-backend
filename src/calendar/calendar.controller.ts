import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { UsuarioService } from '../usuario/usuario.service';
import {
  getOauth2CallbackRedirectUri,
  getWebClientCredentials,
  loadAuthorizedUserFromDiskOrEnv,
} from '../config/google-oauth.helper';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

@Controller('calendar')
export class CalendarController {
  oAuth2Client;

  constructor(
    private usuarioService: UsuarioService,
    private readonly config: ConfigService,
  ) {}

  async loadSavedCredentialsIfExist(): Promise<any> {
    try {
      const credentials = loadAuthorizedUserFromDiskOrEnv(this.config);
      if (!credentials) {
        return null;
      }
      const retorno = google.auth.fromJSON(credentials);
      console.log('retorno' + retorno);
      return retorno;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async authorize() {
    const keys = getWebClientCredentials(this.config);
    const redirectUri = getOauth2CallbackRedirectUri(this.config);

    this.oAuth2Client = new google.auth.OAuth2(
      keys.client_id,
      keys.client_secret,
      redirectUri,
    );
    const client = await this.loadSavedCredentialsIfExist();
    if (client) {
      this.oAuth2Client.setCredentials(client.credentials);

      return this.oAuth2Client;
    }

    const authUrl = this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
    });
    console.log('Controller Authorize this app by visiting this url:', authUrl);
    return null;
  }

  @Get('auth')
  autenticar(@Res() res) {
    this.authorize()
      .then((authClient) => {
        console.log(authClient);
        if (authClient) {
          res.send('Já autenticado. Você pode usar a API agora.');
        } else {
          const keys = getWebClientCredentials(this.config);
          const redirectUri = getOauth2CallbackRedirectUri(this.config);
          this.oAuth2Client = new google.auth.OAuth2(
            keys.client_id,
            keys.client_secret,
            redirectUri,
          );
          const authUrl = this.oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent',
          });
          res.redirect(authUrl);
        }
      })
      .catch((error) => {
        res.status(500).send(`Erro na autenticação: ${error.message}`);
      });
  }

  async getCalendarId(email) {
    const calendar = google.calendar({
      version: 'v3',
      auth: this.oAuth2Client,
    });
    try {
      const response = await calendar.calendarList.list();
      const targetCalendar = response.data.items.find(
        (cal) => cal.id === email,
      );
      if (targetCalendar) {
        return targetCalendar.id;
      } else {
        console.log(
          `Calendário não encontrado para ${email}. Calendários disponíveis:`,
        );
        response.data.items.forEach((cal) => console.log(cal.id));
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar lista de calendários:', error.message);
      return null;
    }
  }

  async ensureAuthenticated(req, res) {
    if (!this.oAuth2Client || this.oAuth2Client.credentials) {
      await this.authorize();
      if (!this.oAuth2Client || !this.oAuth2Client.credentials) {
        return res.status(401).json({
          erro: 'Autenticação necessária',
          detalhes: 'Acesse /auth para autenticar',
        });
      }
    }
  }

  @Get('listar')
  async listar(@Res() res, @Req() req) {
    console.log(process.cwd());

    await this.ensureAuthenticated(req, res);
    const { calendarEmail } = req.query;

    try {
      const calendar = google.calendar({
        version: 'v3',
        auth: this.oAuth2Client,
      });
      const calendarId = await this.getCalendarId(calendarEmail);
      if (!calendarId) {
        return res.status(404).json({
          erro: 'Calendário não encontrado',
          detalhes: `Não foi possível encontrar um calendário para ${calendarEmail}`,
        });
      }
      const response = await calendar.events.list({
        calendarId: calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      });
      const eventos = response.data.items.map((evento) => ({
        id: evento.id,
        summary: evento.summary,
        start: evento.start.dateTime || evento.start.date,
        end: evento.end.dateTime || evento.end.date,
      }));
      res.json(eventos);
    } catch (error) {
      res
        .status(500)
        .json({ erro: 'Erro ao listar eventos', detalhes: error.message });
    }
  }

  @Get('calendarios')
  async calendarios(@Res() res, @Req() req) {
    await this.ensureAuthenticated(req, res);
    try {
      const calendar = google.calendar({
        version: 'v3',
        auth: this.oAuth2Client,
      });

      const response = await calendar.calendarList.list();
      const calendarios = response.data.items.map((cal) => ({
        id: cal.id,
        summary: cal.summary,
      }));
      res.json(calendarios);
    } catch (error) {
      res
        .status(500)
        .json({ erro: 'Erro ao listar calendários', detalhes: error.message });
    }
  }

  @Post('/agendar')
  async agendar(@Res() res, @Req() req) {
    await this.ensureAuthenticated(req, res);

    const {
      nome,
      email,
      dataInicial,
      horaInicial,
      dataFinal,
      horaFinal,
      calendarEmail,
      tipoEvento,
      colorId,
    } = req.body;

    const event = {
      summary: '',
      description: '',
      start: {
        dateTime: `${dataInicial}T${horaInicial}:00`,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: `${dataFinal}T${horaFinal}:00`,
        timeZone: 'America/Sao_Paulo',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
      recurrence: [],
      colorId: colorId || '4',
    };

    switch (tipoEvento) {
      case 'agendamento':
        event.summary = `Agendamento para ${nome}`;
        event.description = `Cliente: ${nome}\nEmail: ${email}`;
        break;
      case 'tarefa':
        event.summary = `Tarefa: ${nome}`;
        event.description = `Descrição: ${email}`;
        break;
      case 'turno':
        event.summary = 'Horário de Trabalho';
        event.description = 'horário definido no sistema';
        event.recurrence = ['RRULE:FREQ=WEEKLY;BYDAY=MO'];
        break;
      default:
        return res.status(400).json({ erro: 'Tipo de evento inválido' });
    }

    try {
      const calendarId = await this.getCalendarId(calendarEmail);

      if (!calendarId) {
        return res.status(404).json({
          erro: 'Calendário não encontrado',
          detalhes: `Não foi possível encontrar um calendário para ${calendarEmail}`,
        });
      }
      const calendar = google.calendar({
        version: 'v3',
        auth: this.oAuth2Client,
      });
      const response = await calendar.events.insert({
        calendarId: calendarId,
        requestBody: event,
      });

      res.json({
        mensagem: 'Evento agendado com sucesso!',
        id: response.data.id,
        calendarId: calendarId,
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ erro: 'Erro ao agendar evento', detalhes: error.message });
    }
  }
}
