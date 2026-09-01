import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import serverless, { type Handler } from "serverless-http";
import { AppModule } from "./src/app.module";

let cachedHandler: Handler | null = null;

export const handler: Handler = async (event, context) => {
  if (!cachedHandler) {
    const app = await NestFactory.create(AppModule, { bodyParser: true });
    app.setGlobalPrefix("api");
    app.enableCors({ credentials: true, origin: true });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
    );
    await app.init();
    cachedHandler = serverless(app.getHttpAdapter().getInstance());
  }
  return cachedHandler(event, context);
};