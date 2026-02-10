from fastapi import APIRouter, HTTPException, Depends
from ..services.ai_service import generate_workshop_layout, process_app_request
from ..models import WorkshopRequest, AppRequest, AppResponse
from .deps import get_current_user

router = APIRouter(prefix="/api/ai", tags=["ai"])

@router.post("/generate-layout")
async def generate_layout(request: WorkshopRequest, user: dict = Depends(get_current_user)):
    try:
        data = await generate_workshop_layout(request.topic, request.model_name)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-request", response_model=AppResponse)
async def app_request(request: AppRequest, user: dict = Depends(get_current_user)):
    try:
        response_text = await process_app_request(request.mode, request.input, request.model_name)
        return AppResponse(text=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
