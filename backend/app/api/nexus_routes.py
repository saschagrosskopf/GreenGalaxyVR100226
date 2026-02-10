from fastapi import APIRouter, HTTPException, Depends
from ..services.nexus_service import nexus_service
from .deps import get_current_user
from typing import List, Dict

router = APIRouter(prefix="/api/nexus", tags=["nexus"])

@router.post("/discovery")
async def nexus_discovery(query: str, user: dict = Depends(get_current_user)):
    try:
        results = await nexus_service.check_discovery(query)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
