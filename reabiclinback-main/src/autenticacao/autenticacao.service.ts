import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../usuario/usuario.service';
import { RedisService } from '../redis/redis.service';

export interface UsuarioPayload {
  sub: number;
  login: string;
  admin: boolean;
  especialidade: string;
  nomeCompleto: string;
}

@Injectable()
export class AutenticacaoService {
  constructor(
    private usuarioService: UsuarioService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async login(login: string, senhaInserida: string) {
    const usuario = await this.usuarioService.buscaPorLogin(login);
    if (usuario === null) {
      throw new UnauthorizedException('O Login ou a senha está incorreta.');
    }
    const usuarioFoiAutenticado = await bcrypt.compare(
      senhaInserida,
      usuario.senha,
    );

    if (!usuarioFoiAutenticado) {
      throw new UnauthorizedException('O Login ou a senha está incorreta.');
    }

    const payload: UsuarioPayload = {
      sub: usuario.id, // subject = sujeito
      login: usuario.login,
      especialidade: usuario.especialidade,
      nomeCompleto: usuario.nomeCompleto,
      admin: usuario.administradorSistema
    };

    const token_acesso = await this.jwtService.signAsync(
      { ...payload, type: 'access' },
      { expiresIn: '15m' },
    );

    const refreshToken = await this.jwtService.signAsync(
      { ...payload, type: 'refresh' },
      { expiresIn: '1h' },
    );
    this.redisService.set(refreshToken, usuario.id);

    return {
      token_acesso,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    const storedToken = { value: '' };
    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = this.jwtService.verify(refreshToken);
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }
    const usuario = await this.usuarioService.buscaUsuarioPorID(payload.sub);
    if (!usuario) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const novoPayload: UsuarioPayload = {
      sub: usuario.id, // subject = sujeito
      login: usuario.login,
      especialidade: usuario.especialidade,
      nomeCompleto: usuario.nomeCompleto,
      admin: usuario.administradorSistema
    };

    const novoTokenAcesso = await this.jwtService.signAsync(
      { ...novoPayload, type: 'access' },
      { expiresIn: '15m' },
    );

    const novoRefreshToken = await this.jwtService.signAsync(
      { ...novoPayload, type: 'refresh' },
      { expiresIn: '1h' },
    );

    this.redisService.set(novoRefreshToken, usuario.id);

    return { token_acesso: novoTokenAcesso, refreshToken: novoRefreshToken };
  }
}
