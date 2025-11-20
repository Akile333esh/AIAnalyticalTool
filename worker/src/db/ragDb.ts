import sql from "mssql";
import { config } from "../config/env";

let ragPool: sql.ConnectionPool;

export async function getRagPool() {
  if (!ragPool) {
    ragPool = await new sql.ConnectionPool({
      user: config.RAG_DB_USER,
      password: config.RAG_DB_PASSWORD,
      server: config.RAG_DB_SERVER,
      database: config.RAG_DB_DATABASE,
      options: {
        encrypt: false,
      },
    }).connect();
  }
  return ragPool;
}
