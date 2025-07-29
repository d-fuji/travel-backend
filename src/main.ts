import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // CORS configuration
  const allowedOrigins = [
    'http://localhost:3000', 
    'http://localhost:3001',
    'https://travel-kappa-ashy.vercel.app'
  ];
  
  // Add any additional origins from environment variable
  if (process.env.ALLOWED_ORIGINS) {
    allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(','));
  }
  
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();