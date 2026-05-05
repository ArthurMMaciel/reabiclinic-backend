import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'usuarios' })
export class UsuarioEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'codigo', length: 100, nullable: true })
  codigo: string;

  @Column({ name: 'login', length: 100, nullable: false })
  login: string;

  @Column({ name: 'email', length: 70, nullable: false })
  email: string;

  @Exclude()
  @Column({ name: 'senha', length: 255, nullable: false })
  senha: string;

  @Column({ name: 'nomeCompleto', length: 255, nullable: false })
  nomeCompleto: string;

  @Column({ name: 'especialidade', length: 255, nullable: true })
  especialidade: string;

  @Column({ name: 'administradorSistema', nullable: false })
  administradorSistema: boolean;

  @Column({ name: 'calendarToken', length: 255, nullable: true })
  calendarToken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @Column({ name: 'ativo', nullable: false })
  ativo: boolean;
}
