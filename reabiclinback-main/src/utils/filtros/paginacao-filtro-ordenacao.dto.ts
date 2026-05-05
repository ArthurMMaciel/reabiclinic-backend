import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';


export function ApiPaginationFiltroOrdenacao() {
  return applyDecorators(
    ApiQuery({
      name: 'offset',
      required: false,
      description: 'Itens a pular'
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Limite de itens por pagina'
    }),
    ApiQuery({
      name: 'order',
      required: false,
      description: 'Ordem ASC ou DESC'
    }),
    ApiQuery({
      name: 'coluna',
      required: false,
      description: 'Coluna a ser ordenada'
    }),
    ApiQuery({
      name: 'filtro',
      required: false,
      description: 'Tem filtro'
    }),
    ApiQuery({
      name: 'field',
      required: false,
      description: 'Campo do filtro'
    }),
    ApiQuery({
      name: 'value',
      required: false,
      description: 'Valor do filtro'
    }),
    ApiQuery({
      name: 'operator',
      required: false,
      description: 'Operador do filtro'
    }),
  );
}
export class PaginationFiltroOrdenacaoDto {
  @IsOptional()
  @IsString()
  filtro?: string;

  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  @IsString()
  coluna?: string;

  @IsOptional()
  @IsString()
  order?: 'ASC' | 'DESC' = 'ASC';

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  offset?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  get skip(): number | undefined {
    return this.offset;
  }

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  get take(): number | undefined {
    return this.limit;
  }
}
