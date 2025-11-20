import sql, { ConnectionPool, config as SqlConfig } from "mssql";
import { config } from "../config/env";
import { logger } from "../utils/logger";

let analyticsPool: ConnectionPool | null = null;

const analyticsDbConfig: SqlConfig = {
  user: config.ANALYTICS_DB_USER,
  password: config.ANALYTICS_DB_PASSWORD,
  server: config.ANALYTICS_DB_HOST,
  database: config.ANALYTICS_DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

export async function getAnalyticsPool(): Promise<ConnectionPool> {
  if (analyticsPool && analyticsPool.connected) {
    return analyticsPool;
  }

  if (analyticsPool && !analyticsPool.connected) {
    await analyticsPool.close();
  }

  analyticsPool = await new sql.ConnectionPool(analyticsDbConfig).connect();
  logger.info("Connected to AnalyticsDB");
  return analyticsPool;
}
