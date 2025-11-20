import sql, { ConnectionPool, config as SqlConfig } from "mssql";
import { config } from "../config/env";
import { logger } from "../utils/logger";

let masterPool: ConnectionPool | null = null;

const masterDbConfig: SqlConfig = {
  user: config.MASTER_DB_USER,
  password: config.MASTER_DB_PASSWORD,
  server: config.MASTER_DB_HOST,
  database: config.MASTER_DB_NAME,
  options: {
    encrypt: false,              // for local/dev; set true with proper certs in prod
    trustServerCertificate: true // allow self-signed certs in dev
  }
};

export async function getMasterPool(): Promise<ConnectionPool> {
  if (masterPool && masterPool.connected) {
    return masterPool;
  }

  if (masterPool && !masterPool.connected) {
    await masterPool.close();
  }

  masterPool = await new sql.ConnectionPool(masterDbConfig).connect();
  logger.info("Connected to MasterDB");
  return masterPool;
}
