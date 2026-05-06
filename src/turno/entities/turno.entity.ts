import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'turnos' })
export class Turno {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  id_profissional: number;

  @Column()
  dia_semana: string;

  @Column()
  hora_inicial: string;

  @Column()
  hora_final: string;

  @Column({ nullable: true })
  duracao?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;
}
