import axios from "axios";
import { config } from "../config/env";

export async function generateSql(payload: any) {
  const res = await axios.post(
    `${config.AIBACKEND_URL}/v1/generate_sql`,
    payload
  );
  return res.data;
}
