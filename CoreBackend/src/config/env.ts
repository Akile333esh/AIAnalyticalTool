import dotenv from "dotenv";

dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || "4000", 10),

  MASTER_DB_HOST: process.env.MASTER_DB_HOST!,
  MASTER_DB_USER: process.env.MASTER_DB_USER!,
  MASTER_DB_PASSWORD: process.env.MASTER_DB_PASSWORD!,
  MASTER_DB_NAME: process.env.MASTER_DB_NAME!,

  ANALYTICS_DB_HOST: process.env.ANALYTICS_DB_HOST!,
  ANALYTICS_DB_USER: process.env.ANALYTICS_DB_USER!,
  ANALYTICS_DB_PASSWORD: process.env.ANALYTICS_DB_PASSWORD!,
  ANALYTICS_DB_NAME: process.env.ANALYTICS_DB_NAME!,

  RAG_DB_HOST: process.env.RAG_DB_HOST!,
  RAG_DB_USER: process.env.RAG_DB_USER!,
  RAG_DB_PASSWORD: process.env.RAG_DB_PASSWORD!,
  RAG_DB_NAME: process.env.RAG_DB_NAME!,

  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",

  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379", 10),

  AI_BACKEND_URL: process.env.AI_BACKEND_URL || "http://localhost:8001"
} as const;
