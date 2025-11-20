from __future__ import annotations

import textwrap
from typing import Any, Dict, List

from app.core.config import config
from app.core.ollama_client import ollama_client
from app.models.schemas import AnalyzeRequest


def _format_rows_for_llm(rows: List[Dict[str, Any]], max_rows: int = 30) -> str:
    if not rows:
        return "No rows returned."

    sample = rows[:max_rows]
    cols = list(sample[0].keys())

    lines: List[str] = []
    lines.append(" | ".join(cols))
    lines.append("-+-".join(["-" * len(c) for c in cols]))
    for r in sample:
        values = [str(r.get(c, "")) for c in cols]
        lines.append(" | ".join(values))

    if len(rows) > max_rows:
        lines.append(f"... ({len(rows) - max_rows} more rows not shown)")

    return "\n".join(lines)


async def analyze_results(request: AnalyzeRequest) -> str:
    """
    Use llama3.1 to analyze tabular query results and provide capacity insights.

    NOTE: Returns a plain analysis string; the API route wraps it
    into AnalyzeResponse for the client.
    """
    table_text = _format_rows_for_llm(request.rows)

    meta_lines: List[str] = []
    if request.query:
        meta_lines.append(f"Original NL query: {request.query}")
    if request.sql:
        meta_lines.append("SQL used (truncated):")
        sql_display = request.sql.strip()
        if len(sql_display) > 1000:
            sql_display = sql_display[:1000] + "... [truncated]"
        meta_lines.append(sql_display)

    meta_block = "\n".join(meta_lines) if meta_lines else "No extra query metadata."

    system_instructions = textwrap.dedent(
        """
        You are an SRE / capacity management expert.
        Analyze the provided tabular data and summarize key capacity insights.

        Requirements:
        - Provide a short summary of what the data shows.
        - Identify any anomalies or outliers (e.g., servers with very high CPU).
        - Comment on trends over time if visible.
        - Suggest 2–5 actionable recommendations (e.g., investigate specific servers).
        - Be concise and practical. Avoid repeating all numbers.
        """
    ).strip()

    user_block = textwrap.dedent(
        f"""
        Context:
        {meta_block}

        Tabular data (sample):
        {table_text}
        """
    ).strip()

    prompt = system_instructions + "\n\n---\n\n" + user_block

    raw_analysis = await ollama_client.generate(
        model=config.ANALYZE_MODEL,
        prompt=prompt,
    )

    return raw_analysis.strip()
