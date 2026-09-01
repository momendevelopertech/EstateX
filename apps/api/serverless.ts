import { NestFactory } from "@nestjs/core";
import { ValidationPipe, type INestApplication } from "@nestjs/common";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type * as express from "express";
import { AppModule } from "./src/app.module";

let cachedApp: INestApplication | null = null;

async function bootstrap(): Promise<express.Express> {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule, { bodyParser: true });
    app.setGlobalPrefix("api");
    app.enableCors({ credentials: true, origin: true });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
    );
    await app.init();
    cachedApp = app;
  }
  return cachedApp.getHttpAdapter().getInstance() as express.Express;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const server = await bootstrap();
  return server(req, res);
}