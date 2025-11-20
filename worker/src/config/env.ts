import * as dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT || 5001,

  REDIS_HOST: process.env.REDIS_HOST || "127.0.0.1",
  REDIS_PORT: Number(process.env.REDIS_PORT || "6379"),

  ANALYTICS_DB_SERVER: process.env.ANALYTICS_DB_SERVER!,
  ANALYTICS_DB_DATABASE: process.env.ANALYTICS_DB_DATABASE!,
  ANALYTICS_DB_USER: process.env.ANALYTICS_DB_USER!,
  ANALYTICS_DB_PASSWORD: process.env.ANALYTICS_DB_PASSWORD!,

  RAG_DB_SERVER: process.env.RAG_DB_SERVER!,
  RAG_DB_DATABASE: process.env.RAG_DB_DATABASE!,
  RAG_DB_USER: process.env.RAG_DB_USER!,
  RAG_DB_PASSWORD: process.env.RAG_DB_PASSWORD!,

  AIBACKEND_URL: process.env.AIBACKEND_URL || "http://localhost:8001",
};

// 👇 Add this required export for BullMQ Worker
export const redisConnection = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
};
