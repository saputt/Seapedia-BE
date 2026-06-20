import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet())

  app.enableCors({
    origin : configService.get<string>("CORS_ORIGINS")?.split(",") ?? ["http://localhost:5173", "http://localhost:5174"],
    methods : 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials : true
  })

  app.use(json({ limit : '2mb' }))
  app.use(urlencoded({ extended : true, limit : '2mb' }))

  app.setGlobalPrefix("api")

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist : true,
      forbidNonWhitelisted : true,
      transform : true,
      exceptionFactory: (validationErrors) => {
      const messages = validationErrors.map(
        (error) => `${error.property}: ${Object.values(error.constraints).join(', ')}`
      );
      return new BadRequestException(messages);
    },
    })
  )

  app.useGlobalInterceptors(new TransformInterceptor)

  app.useGlobalFilters(new GlobalExceptionFilter)

  const config = new DocumentBuilder()
    .setTitle("SEAPEDIA API - Challange")
    .setDescription("SEAPEDIA Backend API Documentation")
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)

  await app.listen(configService.get<number>("PORT") ?? 3000);
}
bootstrap();
