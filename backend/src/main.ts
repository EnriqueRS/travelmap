import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { json, urlencoded } from 'express';
import { WinstonLoggerService } from './logger/winston-logger.service';
import { RequestLoggingInterceptor } from './logger/request-logging.interceptor';
import { ExceptionLoggingFilter } from './logger/exception-logging.filter';

async function bootstrap() {
  const logger = new WinstonLoggerService();
  logger.setDefaultContext('NestApplication');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
  });

  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ limit: '25mb', extended: true }));

  // Sirviendo imágenes locales subidas por el usuario
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global logging interceptor and exception filter
  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  app.useGlobalFilters(new ExceptionLoggingFilter());

  // API Documentation
  const config = new DocumentBuilder()
    .setTitle('TravelMap API')
    .setDescription('TravelMap Backend API with NestJS and PostGIS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`, 'NestApplication');
}

bootstrap();