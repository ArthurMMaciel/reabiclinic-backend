import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AgendamentoAvaliacaoService } from './agendamento_avaliacao.service';
import { CreateAgendamentoAvaliacaoDto } from './dto/create-agendamento_avaliacao.dto';
import { UpdateAgendamentoAvaliacaoDto } from './dto/update-agendamento_avaliacao.dto';

@Controller('agendamento-avaliacao')
export class AgendamentoAvaliacaoController {
  constructor(private readonly agendamentoAvaliacaoService: AgendamentoAvaliacaoService) {}

  @Post()
  create(@Body() createAgendamentoAvaliacaoDto: CreateAgendamentoAvaliacaoDto) {
    return this.agendamentoAvaliacaoService.create(createAgendamentoAvaliacaoDto);
  }

  @Get()
  findAll() {
    return this.agendamentoAvaliacaoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agendamentoAvaliacaoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAgendamentoAvaliacaoDto: UpdateAgendamentoAvaliacaoDto) {
    return this.agendamentoAvaliacaoService.update(+id, updateAgendamentoAvaliacaoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agendamentoAvaliacaoService.remove(+id);
  }
}
