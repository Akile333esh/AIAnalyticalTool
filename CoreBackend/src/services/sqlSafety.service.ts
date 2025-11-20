const FORBIDDEN_KEYWORDS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "MERGE",
  "ALTER",
  "DROP",
  "TRUNCATE",
  "EXEC",
  "EXECUTE",
  "CREATE",
  "GRANT",
  "REVOKE",
  "BACKUP",
  "RESTORE"
];

// We only allow queries that target AnalyticsDB telemetry tables
const FORBIDDEN_SCHEMAS = [
  "MASTERDB", "RAGDB", "MSDB", "TEMPDB", "SYS.", "INFORMATION_SCHEMA"
];

function stripComments(sql: string): string {
  // remove -- line comments
  let noLineComments = sql.replace(/--.*$/gm, "");
  // remove /* */ block comments
  let noBlockComments = noLineComments.replace(/\/\*[\s\S]*?\*\//gm, "");
  return noBlockComments;
}

export function isSqlSafeSelect(sql: string): boolean {
  const cleaned = stripComments(sql).trim();
  const upper = cleaned.toUpperCase();

  // Must start with SELECT or WITH (for CTE)
  if (!(upper.startsWith("SELECT") || upper.startsWith("WITH"))) {
    return false;
  }

  for (const kw of FORBIDDEN_KEYWORDS) {
    if (upper.includes(kw)) {
      return false;
    }
  }

  for (const schema of FORBIDDEN_SCHEMAS) {
    if (upper.includes(schema)) {
      return false;
    }
  }

  return true;
}

export function ensureSqlIsSafeForAnalytics(sql: string): void {
  if (!isSqlSafeSelect(sql)) {
    throw new Error("SQL is not safe. Only SELECT statements on AnalyticsDB telemetry tables are allowed.");
  }
}
