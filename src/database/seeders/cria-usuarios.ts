import dataSource from '../data-source-cli';

import { HashearSenhaPipe } from '../../utils/pipes/hashear-senha.pipe';
import { ConfigService } from '@nestjs/config';
import { UsuarioEntity } from '../../usuario/entities/usuario.entity';

async function seed() {
  const configService = new ConfigService();
  const hashearSenhaPipe = new HashearSenhaPipe(configService);
  await dataSource.initialize();

  const usuarioRepository = dataSource.getRepository(UsuarioEntity);

  const usuario = {
    nome: 'teste',
    email: 'teste@gmail.com',
    senha: await hashearSenhaPipe.transform('teste!@#'),
    ativo: true,
  };

  const novoUsuario = usuarioRepository.create(usuario);
  await usuarioRepository.save(novoUsuario);

  console.log('Seeder de usuario feito com sucesso');
  await dataSource.destroy();
}

seed().catch((error) => console.error('Error seeding usuarios:', error));
