import { Module } from '@nestjs/common';
import { AutenticacaoService } from './autenticacao.service';
import { AutenticacaoController } from './autenticacao.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsuarioModule } from '../usuario/usuario.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    UsuarioModule,
    RedisModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('SEGREDO_JWT');
        if (!secret) {
          throw new Error('SEGREDO_JWT deve estar definido no ambiente.');
        }
        return {
          secret,
          //signOptions: { expiresIn: '72h' },
        };
      },
      inject: [ConfigService],
      global: true,
    }),
  ],
  controllers: [AutenticacaoController],
  providers: [AutenticacaoService],
})
export class AutenticacaoModule {}
