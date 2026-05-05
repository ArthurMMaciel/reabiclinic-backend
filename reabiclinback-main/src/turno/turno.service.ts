/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Turno } from './entities/turno.entity';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { TokenPayloadDto } from '../autenticacao/dto/token-payload.dto';
import { UsuarioService } from '../usuario/usuario.service';

@Injectable()
export class TurnoService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,

    private readonly usuarioService: UsuarioService,
  ) {}

  create(
    createTurnoDto: CreateTurnoDto,
  ) {
    console.log(createTurnoDto);
    return this.turnoRepository.save(
      createTurnoDto,
    );
  }

  findAll() {
    return this.turnoRepository.find();
  }

  findOne(id: number) {
    return this.turnoRepository.find({where:{ id_profissional: id} }).catch(err => console.log(err));
  }

  update(id: number) {
    return `This action updates a #${id} configuracaoHorariosAvaliacao`;
  }

  remove(id: number) {
    return this.turnoRepository.delete(id);
  }

  async findByCodigoProfissional(codigo: string) {
    const usuario = await this.usuarioService.buscaUsuarioPorCodigo(codigo);
    return this.turnoRepository.find({where: { id_profissional: usuario.id }})
  }

  removeDiaSemana(dia_semana: string, tokenPayload: TokenPayloadDto) {
    return this.turnoRepository.delete({ dia_semana: dia_semana, id_profissional: tokenPayload.sub });
  }
}
