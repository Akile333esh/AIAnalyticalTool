from __future__ import annotations
import json
import textwrap
from typing import List

from app.core.config import config
from app.core.ollama_client import ollama_client
from app.models.schemas import SQLGenRequest, RAGMetadata


def _format_metadata(metadata: RAGMetadata | None) -> str:
    if metadata is None:
        return "No explicit metadata provided. You must still only use known telemetry tables."

    parts: List[str] = []

    if metadata.tables:
        parts.append("Tables:")
        for t in metadata.tables:
            parts.append(f"- {t.schema}.{t.name}: {t.description or ''}")

    if metadata.columns:
        parts.append("\nColumns:")
        for c in metadata.columns:
            parts.append(
                f"- {c.table_schema}.{c.table_name}.{c.name} ({c.data_type or 'unknown'}): "
                f"{c.description or ''}"
            )

    if metadata.joins:
        parts.append("\nJoins:")
        for j in metadata.joins:
            parts.append(
                f"- {j.from_table_schema}.{j.from_table_name}.{j.from_column} "
                f"{j.join_type} JOIN "
                f"{j.to_table_schema}.{j.to_table_name}.{j.to_column}"
            )

    if metadata.tags:
        parts.append("\nSemantic Tags:")
        for tag in metadata.tags:
            parts.append(
                f"- [{tag.target_type}] {tag.target} -> {tag.tag} (w={tag.weight})"
            )

    if metadata.examples:
        parts.append("\nExamples:")
        for ex in metadata.examples:
            parts.append(
                f"- NL: {ex.natural_language_query}\n  SQL: {ex.sql_example.strip()}"
            )

    return "\n".join(parts)


async def generate_sql(request: SQLGenRequest) -> str:
    """
    Generate safe T-SQL for AnalyticsDB using sqlcoder:7b via Ollama.
    Only SELECT queries are allowed. No DDL/DML.

    NOTE: This returns a plain SQL string; the API route wraps it
    into SQLGenResponse for the client.
    """
    metadata_block = _format_metadata(request.metadata)

    filter_block = ""
    if request.filters:
        filter_block = f"Structured filters: {json.dumps(request.filters)}"

    time_block = ""
    if request.time_range:
        time_block = f"Time range hint: {request.time_range}"

    metric_block = ""
    if request.metric_type:
        metric_block = f"Metric type hint: {request.metric_type}"

    system_instructions = textwrap.dedent(
        """
        You are an expert SQL Server performance engineer.
        Your task is to generate a single, valid, non-CTE T-SQL SELECT query ONLY.

        HARD REQUIREMENTS:
        - Target database: AnalyticsDB on SQL Server.
        - Allowed tables (if present): dbo.CpuPerformance, dbo.MemoryPerformance, dbo.DiskPerformance.
        - NEVER use INSERT, UPDATE, DELETE, MERGE, ALTER, DROP, TRUNCATE, EXEC, or any DDL/DML.
        - NEVER modify data or schema. SELECT only.
        - Prefer using explicit schema prefix: AnalyticsDB.dbo.TableName.
        - If time filters are needed and not specified, default to last 7 days using DataCollectionDate.
        - Use TOP with a reasonable limit when returning rows (e.g., TOP 1000).
        - If disk metrics are used, remember DiskPerformance has an Instance column for drive letters.

        Output:
        - Return ONLY the SQL query.
        - Do not wrap in backticks or code fences.
        - Do not explain the query here.
        """
    ).strip()

    user_block = textwrap.dedent(
        f"""
        User natural language request:
        {request.natural_language}

        {time_block}
        {metric_block}
        {filter_block}

        Metadata context:
        {metadata_block}
        """
    ).strip()

    prompt = system_instructions + "\n\n---\n\n" + user_block

    raw = await ollama_client.generate(model=config.SQL_MODEL, prompt=prompt)

    # Post-process to strip possible accidental fences/backticks
    sql = raw.strip()
    if "```" in sql:
        parts = sql.split("```")
        if len(parts) >= 3:
            sql = parts[1]
        sql = sql.replace("sql", "", 1).strip()

    return sql

