import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CriaUsuarioDTO } from './dto/CriaUsuario.dto';
import { ListaUsuarioDTO } from './dto/ListaUsuario.dto';
import { AtualizaUsuarioDTO } from './dto/AtualizaUsuario.dto';
import { plainToClass } from 'class-transformer';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AutenticacaoGuard } from '../autenticacao/autenticacao.guard';
import { PaginationFiltroOrdenacaoDto } from '../utils/filtros/paginacao-filtro-ordenacao.dto';
import { HashearSenhaPipe } from '../utils/pipes/hashear-senha.pipe';

//@UseGuards(AutenticacaoGuard)
//@ApiBearerAuth()
@ApiTags('usuarios')
@Controller('usuarios')
export class UsuarioController {
  constructor(private usuarioService: UsuarioService) {}

  @Post()
  async criaUsuario(
    @Body() { senha, ...dadosUsuario }: CriaUsuarioDTO,
    @Body('senha', HashearSenhaPipe) senhaHasheada: string,
  ) {
    const usuarioCriado = await this.usuarioService.criaUsuario({
      ...dadosUsuario,
      senha: senhaHasheada,
    });
    return {
      usuario: new ListaUsuarioDTO(
        usuarioCriado.id,
        usuarioCriado.login,
        usuarioCriado.email,
        usuarioCriado.ativo,
        usuarioCriado.nomeCompleto,
        usuarioCriado.especialidade,
        usuarioCriado.administradorSistema,
      ),
      mensagem: 'usuário criado com sucesso',
    };
  }

  @Get()
  async listaUsuarios(@Query() query: string) {
    const dto = plainToClass(PaginationFiltroOrdenacaoDto, query);

    return this.usuarioService.listaUsuarios(dto);
  }

  @Get('/:id')
  async buscaUsuarioPorID(@Param('id') id: number) {
    const usuarioSalvo = await this.usuarioService.buscaUsuarioPorID(id);
    return usuarioSalvo;
  }

  @Put('/:id')
  async atualizaUsuario(
    @Param('id') id: number,
    @Body() novosDados: AtualizaUsuarioDTO,
  ) {
    const usuarioAtualizado = await this.usuarioService.atualizaUsuario(
      id,
      novosDados,
    );

    return {
      usuario: usuarioAtualizado,
      messagem: 'usuário atualizado com sucesso',
    };
  }

  @Put('/alterar_senha/:id')
  async alterarSenha(
    @Param('id') id: number,
    @Body('senha', HashearSenhaPipe) senhaHasheada: string,
  ) {
    const usuarioAtualizado = await this.usuarioService.alterarSenha(
      id,
      senhaHasheada,
    );

    return {
      usuario: usuarioAtualizado,
      messagem: 'Senha alterada com sucesso',
    };
  }
}
