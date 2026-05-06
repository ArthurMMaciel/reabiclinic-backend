export class ListaUsuarioDTO {
  constructor(
    readonly id: number,
    readonly login: string,
    readonly email: string,
    readonly ativo: boolean,
    readonly nomeCompleto: string,
    readonly especialidade: string,
    readonly administradorSistema: boolean
  ) {}
}
