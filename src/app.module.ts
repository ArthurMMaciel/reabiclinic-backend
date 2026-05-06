import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgendamentoAvaliacaoModule } from './agendamento_avaliacao/agendamento_avaliacao.module';
import { RedisModule } from './redis/redis.module';
import { WhatsappWebhookModule } from './whatsapp_webhook/whatsapp_webhook.module';
import { PacienteModule } from './paciente/paciente.module';
import { CalendarModule } from './calendar/calendar.module';
import { Oauth2CallbackModule } from './oauth2callback/oauth2callback.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresConfigService } from './database/postgres.config.service';
import { ConfigModule } from '@nestjs/config';
import { UsuarioModule } from './usuario/usuario.module';
import { AutenticacaoModule } from './autenticacao/autenticacao.module';
import { TurnoModule } from './turno/turno.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useClass: PostgresConfigService,
      inject: [PostgresConfigService],
    }),
    UsuarioModule,
    AutenticacaoModule,
    AgendamentoAvaliacaoModule,
    WhatsappWebhookModule,
    RedisModule,
    PacienteModule,
    CalendarModule,
    Oauth2CallbackModule,
    TurnoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
