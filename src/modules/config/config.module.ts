import path from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV !== 'production' ? '.env' : '.env.production',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
        PORT: Joi.number(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USER: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        YOUTUBE_API_KEY: Joi.string().required(),
        YOUTUBE_MUSIC_AUTHORIZATION: Joi.string().required(),
        YOUTUBE_MUSIC_COOKIE: Joi.string().required(),
        YOUTUBE_TEMP_DIR: Joi.string().default(path.resolve('./temp')),
      }),
    }),
  ],
})
export class ConfigurationModule {}
