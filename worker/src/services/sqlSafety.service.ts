// Same rules as CoreBackend
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

const FORBIDDEN_SCHEMAS = [
  "MASTERDB",
  "RAGDB",
  "MSDB",
  "TEMPDB",
  "SYS.",
  "INFORMATION_SCHEMA"
];

/**
 * Clean up LLM output and extract just the SQL statement.
 * - Strips ```sql fences
 * - Removes leading explanation/prose
 * - Keeps from first line that starts with SELECT / WITH
 */
export function normalizeGeneratedSql(raw: string): string {
  if (!raw) return raw;

  let text = raw.trim();

  // Remove Markdown code fences like ```sql ... ```
  if (text.startsWith("```")) {
    const lines = text.split(/\r?\n/);
    // remove first line (``` or ```sql)
    lines.shift();

    // remove trailing ``` if present
    if (lines.length && lines[lines.length - 1].trim().startsWith("```")) {
      lines.pop();
    }

    text = lines.join("\n").trim();
  }

  // If there's still prose, pick from first line that starts with SELECT or WITH
  const lines = text.split(/\r?\n/);
  const startIdx = lines.findIndex((line) => {
    const t = line.trim().toUpperCase();
    return t.startsWith("SELECT") || t.startsWith("WITH");
  });

  if (startIdx >= 0) {
    text = lines.slice(startIdx).join("\n").trim();
  }

  return text;
}

/**
 * Hard safety gate: only allows read-only SELECT/WITH, and blocks
 * dangerous keywords & admin schemas.
 */
export function ensureSqlIsSafe(sql: string): void {
  const text = sql.toUpperCase().trim();

  if (!(text.startsWith("SELECT") || text.startsWith("WITH"))) {
    throw new Error("Unsafe SQL: must start with SELECT");
  }

  for (const k of FORBIDDEN_KEYWORDS) {
    if (text.includes(k)) {
      throw new Error(`Unsafe SQL keyword: ${k}`);
    }
  }

  for (const s of FORBIDDEN_SCHEMAS) {
    if (text.includes(s)) {
      throw new Error(`Unsafe schema: ${s}`);
    }
  }
}
