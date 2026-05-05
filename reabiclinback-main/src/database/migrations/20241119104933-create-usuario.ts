import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export default class CreateUsuario20241119104933 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'usuarios',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'login',
            type: 'varchar(200)',
          },
          {
            name: 'login',
            type: 'varchar(200)',
          },
          {
            name: 'email',
            type: 'varchar(200)',
          },
          {
            name: 'senha',
            type: 'varchar(200)',
          },
          {
            name: 'nomeCompleto',
            type: 'varchar(200)',
          },
          {
            name: 'especialidade',
            type: 'varchar(200)',
            isNullable: true,
          },
          {
            name: 'calendarToken',
            type: 'varchar(200)',
            isNullable: true,
          },
          {
            name: 'administradorSistema',
            type: 'boolean',
          },
          {
            name: 'created_at',
            type: 'TIMESTAMP',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'TIMESTAMP',
            default: 'now()',
          },
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('usuarios');
  }
}
