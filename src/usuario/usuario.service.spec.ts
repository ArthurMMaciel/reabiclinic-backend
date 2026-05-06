import { Repository } from 'typeorm';
import { UsuarioService } from './usuario.service';
import { UsuarioEntity } from './entities/usuario.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AtualizaUsuarioDTO } from './dto/AtualizaUsuario.dto';

describe('UsuarioService', () => {
  let usuarioService: UsuarioService;
  let usuarioRepository: Repository<UsuarioEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuarioService,
        {
          provide: getRepositoryToken(UsuarioEntity),
          useValue: {
            save: jest.fn(() => [{ id: 1 }]),
            findOneBy: jest.fn(() => [{"id": 1, "nome": "testeEditado"}]),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    usuarioService = module.get<UsuarioService>(UsuarioService);
    usuarioRepository = module.get<Repository<UsuarioEntity>>(
      getRepositoryToken(UsuarioEntity),
    );
  });
  it('usuarioService deve estar definido', () => {
    expect(usuarioService).toBeDefined();
  });

  describe('criar', () => {

    it('deve editar o nome do Usuario', async () => {
      const id = 1;
      const novoNome = 'testeEditado';
      const atualizaUsuario: AtualizaUsuarioDTO = {
        nome: novoNome,
      };

      const usuarioAtualizado = await usuarioService.atualizaUsuario(
        id,
        atualizaUsuario,
      );

      expect(usuarioRepository.update).toHaveBeenCalledWith(id, {
        nome: novoNome,
      });
      expect(usuarioRepository.findOneBy).toHaveBeenCalledTimes(2);
      expect(usuarioAtualizado).toEqual([{ id: 1, nome: novoNome }]);

    });

    it('deve editar o nome do Usuario', async () => {
        const id = 1;
        const novoNome = 'testeEditado';
        const atualizaUsuario: AtualizaUsuarioDTO = {
          nome: novoNome,
        };
  
        const usuarioAtualizado = await usuarioService.atualizaUsuario(
          id,
          atualizaUsuario,
        );
  
        expect(usuarioRepository.update).toHaveBeenCalledWith(id, {
          nome: novoNome
        });
        expect(usuarioRepository.findOneBy).toHaveBeenCalledTimes(2);
        expect(usuarioAtualizado).toEqual([{ id: 1, nome: novoNome }]);

      });

  });
});
