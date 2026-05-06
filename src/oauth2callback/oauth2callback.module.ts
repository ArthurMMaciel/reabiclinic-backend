import { Module } from '@nestjs/common';
import { Oauth2CallbackController } from './oauth2callback.controller';

@Module({
  controllers: [Oauth2CallbackController],
})
export class Oauth2CallbackModule {}
