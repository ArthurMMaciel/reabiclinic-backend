import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turno } from './entities/turno.entity';
import { TurnoService } from './turno.service';
import { TurnoController } from './turno.controller';
import { UsuarioService } from '../usuario/usuario.service';
import { UsuarioEntity } from '../usuario/entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Turno,UsuarioEntity])],
  controllers: [TurnoController],
  providers: [TurnoService, UsuarioService],
  exports: [TurnoService]
})
export class TurnoModule {}
