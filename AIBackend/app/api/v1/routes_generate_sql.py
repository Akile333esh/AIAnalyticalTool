from fastapi import APIRouter, HTTPException
from typing import Any
# models and service will be implemented in later steps
from app.models.schemas import SQLGenRequest, SQLGenResponse
from app.services.sql_generation_service import generate_sql

router = APIRouter(tags=["sql_generation"])

@router.post("/generate_sql", response_model=SQLGenResponse)
async def generate_sql_endpoint(payload: SQLGenRequest):
    """
    Generate T-SQL from an NL query + optional filters/context.
    """
    try:
        sql_text: str = await generate_sql(payload)
        return SQLGenResponse(generated_sql=sql_text)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
