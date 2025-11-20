import sql, { ConnectionPool, config as SqlConfig } from "mssql";
import { config } from "../config/env";
import { logger } from "../utils/logger";

let ragPool: ConnectionPool | null = null;

const ragDbConfig: SqlConfig = {
  user: config.RAG_DB_USER,
  password: config.RAG_DB_PASSWORD,
  server: config.RAG_DB_HOST,
  database: config.RAG_DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

export async function getRagPool(): Promise<ConnectionPool> {
  if (ragPool && ragPool.connected) {
    return ragPool;
  }

  if (ragPool && !ragPool.connected) {
    await ragPool.close();
  }

  ragPool = await new sql.ConnectionPool(ragDbConfig).connect();
  logger.info("Connected to RAGDB");
  return ragPool;
}
