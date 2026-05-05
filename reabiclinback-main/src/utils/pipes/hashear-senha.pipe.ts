import { Injectable, PipeTransform } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashearSenhaPipe implements PipeTransform {
  constructor(private configService: ConfigService) {}
  async transform(senha: string) {
    //const sal = this.configService.get<string>('SAL_SENHA');
    const sal = '$2b$10$ZOrRIn7j33o9W2QovGihV.'
    const senhaHasheada = await bcrypt.hash(senha, sal!);
    return senhaHasheada;
  }
}
