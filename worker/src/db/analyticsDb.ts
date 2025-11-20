import sql from "mssql";
import { config } from "../config/env";

let analyticsPool: sql.ConnectionPool;

export async function getAnalyticsPool() {
  if (!analyticsPool) {
    analyticsPool = await new sql.ConnectionPool({
      user: config.ANALYTICS_DB_USER,
      password: config.ANALYTICS_DB_PASSWORD,
      server: config.ANALYTICS_DB_SERVER,
      database: config.ANALYTICS_DB_DATABASE,
      options: {
        encrypt: false,
      },
    }).connect();
  }
  return analyticsPool;
}
