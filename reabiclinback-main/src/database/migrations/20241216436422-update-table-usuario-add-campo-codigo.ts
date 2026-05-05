import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTableUsuarioAddCampoCodigo20241216436422
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adiciona a coluna 'codigo'
    await queryRunner.query(`
            ALTER TABLE usuarios
            ADD COLUMN codigo varchar(100)
        `);

    // Atualiza os registros existentes para que 'codigo' tenha o mesmo valor que 'id'
    await queryRunner.query(`
            UPDATE usuarios
            SET codigo = id
        `);

    // Adiciona a restrição NOT NULL à coluna 'codigo'
    await queryRunner.query(`
            ALTER TABLE usuarios
            ALTER COLUMN codigo SET NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove a coluna 'codigo'
    await queryRunner.query(`
            ALTER TABLE usuarios
            DROP COLUMN codigo
        `);
  }
}
