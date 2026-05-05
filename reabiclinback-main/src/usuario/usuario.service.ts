import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ListaUsuarioDTO } from './dto/ListaUsuario.dto';
import { UsuarioEntity } from './entities/usuario.entity';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { AtualizaUsuarioDTO } from './dto/AtualizaUsuario.dto';
import { CriaUsuarioDTO } from './dto/CriaUsuario.dto';
import { PaginationFiltroOrdenacaoDto } from '../utils/filtros/paginacao-filtro-ordenacao.dto';
import { buildWhereCondition } from '../utils/filtros/FiltroBuilder';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(UsuarioEntity)
    private readonly usuarioRepository: Repository<UsuarioEntity>,
  ) {}

  async criaUsuario(dadosDoUsuario: CriaUsuarioDTO) {
    const usuarioEntity = new UsuarioEntity();
    const emailExiste = await this.buscaPorEmail(dadosDoUsuario.email);

    if (emailExiste) {
      throw new ConflictException('Já existe um usuário com este e-mail');
    }
    Object.assign(usuarioEntity, dadosDoUsuario as UsuarioEntity);

    const usuarioSalvo = await this.usuarioRepository.save({
      ...usuarioEntity,
      administradorSistema: false,
      ativo: true,
    });

    return usuarioSalvo;
  }

  async listaUsuariosWhatsapp() {
    const usuarios = await this.usuarioRepository.find({
      where: { ativo: true, administradorSistema: false },
      order: { codigo: 'ASC' },
    });
    console.log(usuarios);
    return { usuarios };
  }

  async listaUsuarios(query: PaginationFiltroOrdenacaoDto) {
    const {
      take,
      skip,
      coluna = 'createdAt',
      order,
      filtro,
      field,
      operator,
      value,
    } = query;

    const where = filtro
      ? buildWhereCondition<UsuarioEntity>({ field, operator, value })
      : undefined;

    const options: FindManyOptions<UsuarioEntity> = {
      where,
      order: { [coluna]: order },
      ...(take !== undefined && skip !== undefined && { take, skip }),
    };

    const [usuarios, contador] = await Promise.all([
      this.usuarioRepository.find(options),
      this.usuarioRepository.count({ where }),
    ]);

    return { contador, usuarios };
  }

  async buscaPorEmail(email: any) {
    const checkEmail = await this.usuarioRepository.findOneBy({
      email,
    });
    return checkEmail;
  }

  async buscaPorLogin(login: any) {
    const checkLogin = await this.usuarioRepository.findOneBy({
      login,
    });
    return checkLogin;
  }

  async alterarSenha(id: number, senha: string) {
    const entityName = await this.usuarioRepository.findOneBy({ id });

    if (entityName === null) {
      throw new NotFoundException('O usuario não foi encontrado');
    }
    await this.usuarioRepository.update(id, { senha: senha });
    return this.usuarioRepository.findOneBy({ id: id });
  }

  async atualizaUsuario(id: number, novosDados: AtualizaUsuarioDTO) {
    const entityName = await this.usuarioRepository.findOneBy({ id });

    if (entityName === null) {
      throw new NotFoundException('O usuario não foi encontrado');
    }
    await this.usuarioRepository.update(id, novosDados);
    return this.usuarioRepository.findOneBy({ id: id });
  }

  async deletaUsuario(id: string) {
    await this.usuarioRepository.delete(id);
  }

  async buscaUsuarioPorCodigo(codigo: string) {
    const usuarioSalvo = await this.usuarioRepository.findOne({
      where: { codigo },
    });

    if (usuarioSalvo === null) {
      throw new NotFoundException('O usuario não foi encontrado');
    }

    const listaUsuario = new ListaUsuarioDTO(
      usuarioSalvo.id,
      usuarioSalvo.login,
      usuarioSalvo.email,
      usuarioSalvo.ativo,
      usuarioSalvo.nomeCompleto,
      usuarioSalvo.especialidade,
      usuarioSalvo.administradorSistema,
    );
    return listaUsuario;
  }
  async buscaUsuarioPorID(id: number) {
    const usuarioSalvo = await this.usuarioRepository.findOne({
      where: { id },
    });

    if (usuarioSalvo === null) {
      throw new NotFoundException('O usuario não foi encontrado');
    }

    const listaUsuario = new ListaUsuarioDTO(
      usuarioSalvo.id,
      usuarioSalvo.login,
      usuarioSalvo.email,
      usuarioSalvo.ativo,
      usuarioSalvo.nomeCompleto,
      usuarioSalvo.especialidade,
      usuarioSalvo.administradorSistema,
    );
    return listaUsuario;
  }
}
