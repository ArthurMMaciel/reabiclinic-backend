import { MigrationInterface, QueryRunner, Table } from "typeorm";

export default class CreateTurno20241204155716
  implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
          new Table({
            name: 'turnos',
            columns: [
              {
                name: 'id',
                type: 'integer',
                isPrimary: true,
                isGenerated: true,
                generationStrategy: 'increment',
              },
              {
                name: 'id_profissional',
                type: 'int',
              },
              {
                name: 'dia_semana',
                type: 'varchar(50)',
              },
              {
                name: 'hora_inicial',
                type: 'varchar(50)',
              },
              {
                name: 'hora_final',
                type: 'varchar(50)',
              },
              {
                name: 'duracao',
                type: 'varchar(50)',
                isNullable: true
              },
              {
                name: 'created_at',
                type: 'timestamp',
                default: 'now()',
              },
              {
                name: 'updated_at',
                type: 'timestamp',
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
        await queryRunner.dropTable('turnos');
      }
  }