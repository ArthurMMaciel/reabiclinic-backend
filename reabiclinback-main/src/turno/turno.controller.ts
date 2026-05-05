import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { AutenticacaoGuard } from '../autenticacao/autenticacao.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TurnoService } from './turno.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { TokenPayloadParam } from '../autenticacao/params/token-payload.params';
import { TokenPayloadDto } from '../autenticacao/dto/token-payload.dto';

@UseGuards(AutenticacaoGuard)
@ApiBearerAuth()
@ApiTags('turnos')
@Controller('turnos')
export class TurnoController {
  constructor(
    private readonly turnoService: TurnoService,
  ) {}

  @Post()
  create(
    @Body()
    createTurnoDto: CreateTurnoDto,
  ) {
    return this.turnoService.create(
      createTurnoDto,
    );
  }

  @Get()
  findAll() {
    return this.turnoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.turnoService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.turnoService.remove(+id);
  }

  @Delete('dia_semana/:dia_semana')
  removeDiaSemana(@Param('dia_semana') dia_semana: string, @TokenPayloadParam() tokenPayload: TokenPayloadDto) {
    return this.turnoService.removeDiaSemana(dia_semana,tokenPayload);
  }
}
