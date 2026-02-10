import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .api import ai_routes, auth_routes
from .services.auth_service import HAS_FULL_CREDENTIALS
import os

load_dotenv()

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("greengalaxy-api")

app = FastAPI(title="GreenGalaxy VR Backend")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.info(f"Method: {request.method} Path: {request.url.path} Status: {response.status_code} Duration: {duration:.2f}s")
    return response

app.include_router(ai_routes.router)
app.include_router(auth_routes.router)
app.include_router(nexus_routes.router)

# CORS configuration (Enterprise Hardening)
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {exc}", exc_info=True)
    return {
        "status": "error",
        "detail": "Internal Server Error. Please contact support.",
        "request_id": request.headers.get("X-Request-ID", "unknown")
    }

@app.get("/")
def read_root():
    return {"status": "ok", "message": "GreenGalaxy VR Backend Running"}

@app.get("/health")
def health_check():
    gemini_status = "ok" if os.getenv("GEMINI_API_KEY") else "missing_key"
    firebase_status = "full" if HAS_FULL_CREDENTIALS else "limited"
    
    return {
        "status": "healthy",
        "version": "1.0.0",
        "dependencies": {
            "gemini": gemini_status,
            "firebase": firebase_status
        }
    }

