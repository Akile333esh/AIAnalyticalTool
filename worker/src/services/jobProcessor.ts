import { ensureSqlIsSafe, normalizeGeneratedSql } from "./sqlSafety.service";
import { generateSql } from "./aiBackendClient";
import { publishJobEvent } from "./ssePublisher";
import { getAnalyticsPool } from "../db/analyticsDb";
import sql from "mssql";

export async function processJob(job: any) {
  const jobId = job.id;
  const {
    userId,
    jobToken, // not used directly, but included for completeness
    naturalLanguageQuery,
    timeRange,
    metricType,
    filters
  } = job.data;

  try {
    // 1) Notify that we received the job
    await publishJobEvent(jobId, {
      type: "step",
      message: "Received job. Calling AIBackend to generate SQL."
    });

    // 2) Call AIBackend /v1/generate_sql
    const sqlGen = await generateSql({
      // this MUST match SQLGenRequest in AIBackend
      natural_language: naturalLanguageQuery,
      time_range: timeRange || null,
      metric_type: metricType || null,
      filters: filters || null,
      metadata: {}, // adjust later if you pass RAG metadata
      user_id: userId,
      job_id: String(jobId)
    });

    const rawSql: string =
      (sqlGen && (sqlGen.generated_sql || sqlGen.sql)) || "";

    // 3) Normalize LLM output → pure SQL
    const sqlQuery = normalizeGeneratedSql(rawSql);

    if (!sqlQuery) {
      throw new Error("AIBackend did not return a SQL query");
    }

    await publishJobEvent(jobId, {
      type: "step",
      message: "Validating generated SQL for safety.",
      sqlQuery,
      sqlExplanation: sqlGen.reasoning
    });

    // 4) Enforce read-only + schema safety
    ensureSqlIsSafe(sqlQuery);

    await publishJobEvent(jobId, {
      type: "step",
      message: "Running query against AnalyticsDB."
    });

    // 5) Execute against AnalyticsDB
    const pool = await getAnalyticsPool();
    const result = await pool.request().query(sqlQuery);

    // 6) Send rows back via SSE
    await publishJobEvent(jobId, {
      type: "done",
      message: "Completed",
      rows: result.recordset
    });

    return result.recordset;
  } catch (err: any) {
    // Surface a nice error message to the frontend too
    await publishJobEvent(jobId, {
      type: "error",
      message: err?.message ?? "Job failed"
    });
    throw err;
  }
}
