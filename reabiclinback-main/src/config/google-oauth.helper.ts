import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const TOKEN_PATH = path.join(process.cwd(), 'token.json');

export function getWebClientCredentials(config: ConfigService): {
  client_id: string;
  client_secret: string;
} {
  if (fs.existsSync(CREDENTIALS_PATH)) {
    const raw = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
    return raw.web;
  }
  const clientId = config.get<string>('CLIENT_ID');
  const clientSecret = config.get<string>('CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error(
      'Coloque credentials.json na raiz do projeto ou defina CLIENT_ID e CLIENT_SECRET no .env.',
    );
  }
  return { client_id: clientId, client_secret: clientSecret };
}

export function loadAuthorizedUserFromDiskOrEnv(
  config: ConfigService,
): object | null {
  if (fs.existsSync(TOKEN_PATH)) {
    return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  }
  const refreshToken = config.get<string>('GOOGLE_REFRESH_TOKEN');
  if (!refreshToken) {
    return null;
  }
  const web = getWebClientCredentials(config);
  return {
    type: 'authorized_user',
    client_id: web.client_id,
    client_secret: web.client_secret,
    refresh_token: refreshToken,
  };
}

/** Callback registrado no Google Cloud para rota /oauth2callback */
export function getOauth2CallbackRedirectUri(config: ConfigService): string {
  return (
    config.get<string>('REDIRECT_URI') ||
    `${config.get<string>('URL_AMBIENTE') || 'http://localhost:3000'}/oauth2callback`
  );
}

/** Callback para o fluxo do CalendarService (rota /calendar/oauth2callback no deploy) */
export function getCalendarOAuthRedirectUri(config: ConfigService): string {
  return (
    config.get<string>('CALENDAR_OAUTH_REDIRECT_URI') ||
    `${config.get<string>('URL_AMBIENTE') || 'http://localhost:3000'}/calendar/oauth2callback`
  );
}

export function getTokenFilePath(): string {
  return TOKEN_PATH;
}
