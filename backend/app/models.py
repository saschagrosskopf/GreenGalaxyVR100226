from pydantic import BaseModel
from typing import List, Optional, Any

class SceneObject(BaseModel):
    type: str
    title: Optional[str] = None
    color: Optional[str] = None
    pos: dict
    size: Optional[dict] = None
    rot: Optional[dict] = None
    content: Optional[str] = None

class WorkshopRequest(BaseModel):
    topic: str
    model_name: Optional[str] = "gemini-1.5-flash"

class AppRequest(BaseModel):
    mode: str
    input: str
    model_name: Optional[str] = "gemini-1.5-flash"

class AppResponse(BaseModel):
    text: str
