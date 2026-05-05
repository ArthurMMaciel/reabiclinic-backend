import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { WhatsappWebhookService } from '../whatsapp_webhook/whatsapp_webhook.service';
import { WhatsappWebhookModule } from '../whatsapp_webhook/whatsapp_webhook.module';

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
