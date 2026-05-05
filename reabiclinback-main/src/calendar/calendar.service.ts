import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { calendar_v3, google } from 'googleapis';
import * as fs from 'fs';
import { CreateEventDto } from './dto/create-event.dto';
import { UsuarioService } from '../usuario/usuario.service';
import {
  getCalendarOAuthRedirectUri,
  getWebClientCredentials,
  loadAuthorizedUserFromDiskOrEnv,
  getTokenFilePath,
} from '../config/google-oauth.helper';

@Injectable()
export class CalendarService {
  private oAuth2Client;

  constructor(
    public readonly usuarioService: UsuarioService,
    private readonly config: ConfigService,
  ) {
    void this.initializeOAuthClient();
  }

  async loadSavedCredentialsIfExist(profissionalEscolhido) {
    try {
      const credentials = loadAuthorizedUserFromDiskOrEnv(this.config);
      if (!credentials) {
        return null;
      }
      return google.auth.fromJSON(credentials);
    } catch (err) {
      return null;
    }
  }

  async initializeOAuthClient() {
    const keys = getWebClientCredentials(this.config);
    const redirectUri = getCalendarOAuthRedirectUri(this.config);
    this.oAuth2Client = new google.auth.OAuth2(
      keys.client_id,
      keys.client_secret,
      redirectUri,
    );

    const savedCredentials = await this.loadSavedCredentials();
    if (savedCredentials) {
      this.oAuth2Client.setCredentials(savedCredentials);
    }
  }

  async loadSavedCredentials() {
    try {
      const raw = loadAuthorizedUserFromDiskOrEnv(this.config);
      if (!raw) {
        return null;
      }
      const parsed = raw as Record<string, unknown>;
      return {
        refresh_token: parsed.refresh_token as string | undefined,
        access_token: parsed.access_token as string | undefined,
        expiry_date: parsed.expiry_date as number | undefined,
      };
    } catch (error) {
      return null;
    }
  }

  async saveCredentials() {
    const keys = getWebClientCredentials(this.config);
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: keys.client_id,
      client_secret: keys.client_secret,
      refresh_token: this.oAuth2Client.credentials.refresh_token,
    });
    fs.writeFileSync(getTokenFilePath(), payload, 'utf-8');
  }

  async authorize(profissionalEscolhido) {
    let oAuth2Client;
    const key = getWebClientCredentials(this.config);
    const redirectUri = getCalendarOAuthRedirectUri(this.config);
    oAuth2Client = new google.auth.OAuth2(
      key.client_id,
      key.client_secret,
      redirectUri,
    );

    const client = await this.loadSavedCredentialsIfExist(profissionalEscolhido);
    if (client) {
      oAuth2Client.setCredentials(client.credentials);
      return oAuth2Client;
    }
    return null;
  }

  async handleOAuth2Callback(code: string) {
    const { tokens } = await this.oAuth2Client.getToken(code);
    this.oAuth2Client.setCredentials(tokens);
    await this.saveCredentials();
  }

  async createEvent(createEventDto: CreateEventDto) {
    const { nome, email, data, hora, calendarEmail, tipoEvento } =
      createEventDto;

    const event: calendar_v3.Schema$Event = {
      summary: '',
      description: '',
      start: {
        dateTime: `${data}T${hora}:00`,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: `${data}T${hora}:30`,
        timeZone: 'America/Sao_Paulo',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
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
      case 'aniversario':
        event.summary = `Aniversário de ${nome}`;
        event.description = `Aniversário de ${nome}\nEmail: ${email}`;
        event.recurrence = ['RRULE:FREQ=YEARLY'];
        break;
      default:
        throw new Error('Tipo de evento inválido');
    }

    const calendar = google.calendar({
      version: 'v3',
      auth: this.oAuth2Client,
    });
    const calendarId = await this.getCalendarId(calendarEmail);

    if (!calendarId) {
      throw new Error(`Calendário não encontrado para ${calendarEmail}`);
    }

    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });

    return {
      mensagem: 'Evento agendado com sucesso!',
      id: response.data.id,
      calendarId,
    };
  }

  async listEvents(listEventsDto: any) {
    const { calendarEmail } = listEventsDto;
    const calendar = google.calendar({
      version: 'v3',
      auth: this.oAuth2Client,
    });
    const calendarId = await this.getCalendarId(calendarEmail);

    if (!calendarId) {
      throw new Error(`Calendário não encontrado para ${calendarEmail}`);
    }

    const response = await calendar.events.list({
      calendarId,
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items.map((evento) => ({
      id: evento.id,
      summary: evento.summary,
      start: evento.start.dateTime || evento.start.date,
      end: evento.end.dateTime || evento.end.date,
    }));
  }

  async listCalendars() {
    const calendar = google.calendar({
      version: 'v3',
      auth: this.oAuth2Client,
    });
    const response = await calendar.calendarList.list();
    return response.data.items.map((cal) => ({
      id: cal.id,
      summary: cal.summary,
    }));
  }

  async getCalendarId(email: string) {
    const calendar = google.calendar({
      version: 'v3',
      auth: this.oAuth2Client,
    });
    const response = await calendar.calendarList.list();
    const targetCalendar = response.data.items.find(
      (cal) => cal.id === email,
    );

    if (!targetCalendar) {
      throw new Error(`Calendário não encontrado para ${email}`);
    }

    return targetCalendar.id;
  }
}
