import { Controller, Post, Body } from '@nestjs/common';
import { AutenticacaoService } from './autenticacao.service';
import { AutenticaDTO } from './dto/autentica.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('autenticacao')
@ApiTags('autenticacao')
export class AutenticacaoController {
  constructor(private readonly autenticacaoService: AutenticacaoService) {}

  @Post('login')
  create(@Body() { login, senha }: AutenticaDTO) {
    return this.autenticacaoService.login(login, senha);
  }

  @Post('atualiza_token')
  renovar_token(@Body() body: any) {
    const { refreshToken } = body;
    return this.autenticacaoService.refresh(refreshToken);
  }
}
