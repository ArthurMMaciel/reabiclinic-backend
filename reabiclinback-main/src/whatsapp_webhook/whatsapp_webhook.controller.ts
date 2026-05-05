import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappWebhookService } from './whatsapp_webhook.service';
import { Request, Response } from 'express';
import axios from 'axios';

@Controller('webhook')
export class WhatsappWebhookController {
  constructor(
    private readonly whatsappWebhookService: WhatsappWebhookService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async verificaWebhook(@Req() req: Request, @Res() res: Response) {
    const verifyToken =
      this.config.get<string>('WHATSAPP_VERIFY_TOKEN') ??
      this.config.get<string>('WHATSAPP_API_TOKEN');
    if (
      req.query['hub.mode'] === 'subscribe' ||
      req.query['hub.verify_token'] === verifyToken
    ) {
      res.send(req.query['hub.challenge']);
    } else {
      console.log('NNnao ddeu certo');
      console.log(req.query);
      res.sendStatus(400);
    }
  }

  @Post()
  async sendMessage(@Req() req: Request, @Res() res: Response) {
    try {
      console.log('req');
      const entry = req.body['entry'];
      const changes = entry[0]['changes'][0];
      const value = changes['value'];
      const objetoMensagem = value['messages'];
      const tipo = objetoMensagem[0]['type'];
      const phone_number_id = '479681805227427';

      if (tipo === 'interactive') {
        const tipoInterativo = objetoMensagem[0]['interactive']['type'];

        if (tipoInterativo == 'button_reply') {
          const texto = objetoMensagem[0]['interactive']['button_reply']['id'];
          const numero = objetoMensagem[0]['from'];
          await this.whatsappWebhookService.enviarMensagemWhatsapp(
            texto,
            numero,
            phone_number_id,
          );
        }
      }
      if (typeof objetoMensagem !== 'undefined') {
        const messages = objetoMensagem[0];
        const texto = messages['text']['body'];
        const numero = messages['from'];

        await this.whatsappWebhookService.enviarMensagemWhatsapp(
          texto,
          numero,
          phone_number_id,
        );
      }
      res.send('EVENT_RECEIVED');
    } catch (error) {
      //    console.log(error);
      res.send('EVENT_RECEIVED');
    }
  }
}

const adjustPhoneNumber = (phoneNumber: string): string => {
  const regex = /^(55\d{2})(\d{4,5})(\d{4})$/;
  return phoneNumber.replace(regex, '$19$2$3');
};
