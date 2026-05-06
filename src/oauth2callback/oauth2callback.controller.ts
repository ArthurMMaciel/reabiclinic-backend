import { Controller, Get, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import { google } from 'googleapis';
import {
  getOauth2CallbackRedirectUri,
  getWebClientCredentials,
  getTokenFilePath,
} from '../config/google-oauth.helper';

@Controller('oauth2callback')
export class Oauth2CallbackController {
  oAuth2Client;

  constructor(private readonly config: ConfigService) {}

  async saveCredentials(client) {
    const key = getWebClientCredentials(this.config);
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(getTokenFilePath(), payload, 'utf-8');
  }

  @Get()
  async handleCallback(@Req() req, @Res() res) {
    const { code } = req.query;
    try {
      const key = getWebClientCredentials(this.config);
      const redirectUri = getOauth2CallbackRedirectUri(this.config);
      this.oAuth2Client = new google.auth.OAuth2(
        key.client_id,
        key.client_secret,
        redirectUri,
      );
      const { tokens } = await this.oAuth2Client.getToken(code);
      this.oAuth2Client.setCredentials(tokens);
      await this.saveCredentials(this.oAuth2Client);
      res.send('Autenticação bem-sucedida! Você pode fechar esta janela.');
    } catch (err) {
      res.status(500).send('Erro durante a autenticação: ' + err.message);
    }
  }
}
