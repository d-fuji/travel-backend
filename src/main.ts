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
  
  // CORS configuration - dynamic origin checking
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // List of allowed origin patterns
      const allowedPatterns = [
        /^http:\/\/localhost:\d+$/, // localhost with any port
        /^https:\/\/.*\.vercel\.app$/, // any Vercel deployment
        /^https:\/\/travel.*\.vercel\.app$/, // travel project on Vercel
      ];
      
      // Add custom patterns from environment variable
      if (process.env.CORS_PATTERNS) {
        const customPatterns = process.env.CORS_PATTERNS.split(',').map(pattern => new RegExp(pattern));
        allowedPatterns.push(...customPatterns);
      }
      
      // Check if origin matches any pattern
      const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
      
      if (isAllowed) {
        console.log(`CORS: Allowed origin ${origin}`);
        callback(null, true);
      } else {
        console.log(`CORS: Blocked origin ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();