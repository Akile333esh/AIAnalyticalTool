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
  "RESTORE",
  "INTO",   // <--- Crucial: Prevents 'SELECT * INTO new_table'
  "PRAGMA",
  "DBCC",
  "DENY"
];

// We only allow queries that target AnalyticsDB telemetry tables
// Using Regex to ensure we don't accidentally flag partial matches
const FORBIDDEN_SCHEMAS = [
  "MASTERDB", "RAGDB", "MSDB", "TEMPDB", "SYS", "INFORMATION_SCHEMA"
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
  
  // Normalize for case-insensitive checking
  const upper = cleaned.toUpperCase();

  // 1. Must start with SELECT or WITH (for CTE)
  if (!(upper.startsWith("SELECT") || upper.startsWith("WITH"))) {
    return false;
  }

  // 2. Check for Forbidden Keywords using Word Boundaries (\b)
  // This prevents false positives like "UPDATE_DATE" or "Raindrop"
  for (const kw of FORBIDDEN_KEYWORDS) {
    // Regex: \bWORD\b matches whole words only
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    if (regex.test(cleaned)) {
      console.warn(`SQL Safety Block: Found forbidden keyword '${kw}'`);
      return false;
    }
  }

  // 3. Check for Forbidden Schemas
  for (const schema of FORBIDDEN_SCHEMAS) {
    // Check if the schema appears as a prefix to a table (e.g., "SYS.")
    // or just strictly present if it's a known risky schema
    if (upper.includes(schema)) {
      console.warn(`SQL Safety Block: Found forbidden schema '${schema}'`);
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
