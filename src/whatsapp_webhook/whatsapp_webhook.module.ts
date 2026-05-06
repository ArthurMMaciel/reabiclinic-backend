import { Module } from '@nestjs/common';
import { WhatsappWebhookController } from './whatsapp_webhook.controller';
import { WhatsappWebhookService } from './whatsapp_webhook.service';
import { RedisModule } from '../redis/redis.module';
import { PacienteService } from '../paciente/paciente.service';
import { TurnoService } from '../turno/turno.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turno } from '../turno/entities/turno.entity';
import { UsuarioService } from '../usuario/usuario.service';
import { UsuarioEntity } from '../usuario/entities/usuario.entity';
import { UsuarioModule } from '../usuario/usuario.module';
@Module({
  imports: [TypeOrmModule.forFeature([Turno,UsuarioEntity]),RedisModule, UsuarioModule],
  controllers: [WhatsappWebhookController],
  providers: [WhatsappWebhookService, PacienteService, TurnoService, UsuarioService],
  exports: [WhatsappWebhookService]
})
export class WhatsappWebhookModule {}
