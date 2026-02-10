from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from ..services.auth_service import verify_google_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    idToken: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str = "User"
    picture: str = ""
    role: str = "USER"
    orgId: str = "org_def"

class AuthResponse(BaseModel):
    status: str
    session: dict  # Includes token and user

@router.post("/google", response_model=AuthResponse)
async def google_login(data: LoginRequest = Body(...)):
    user_data = await verify_google_token(data.idToken)
    
    if not user_data:
        # Fallback for Demo/Mock tokens if needed, OR Strict failure
        # raise HTTPException(status_code=401, detail="Invalid Authentication Token")
        # For this specific user request, we want REAL verification.
        # But if they don't have creds set up, it will fail.
        # Let's provide a helpful error.
        raise HTTPException(status_code=401, detail="Token verification failed. Check backend logs for credential issues.")

    # Convert Firebase User to App User
    user = UserResponse(
        id=user_data['uid'],
        email=user_data['email'] or "",
        name=user_data['name'] or "User",
        picture=user_data['picture'] or ""
    )

    return {
        "status": "ok",
        "session": {
            "token": data.idToken, # Keep using the ID token as session token for now
            "user": user.dict(),
            "org": { 
                "id": "org_def", 
                "name": "GreenGalaxy HQ", 
                "primaryColor": "#06B6D4", 
                "secondaryColor": "#1E293B", 
                "status": "VERIFIED", 
                "plan": "ENTERPRISE",
                "subscriptionStatus": "ACTIVE"
            } 
        }
    }
