import google.generativeai as genai
import os
import json
from ..models import SceneObject

# Configure API Key
GENAI_API_KEY = os.getenv("GEMINI_API_KEY")
if GENAI_API_KEY:
    genai.configure(api_key=GENAI_API_KEY)

async def generate_workshop_layout(topic: str, model_name: str = "gemini-1.5-pro") -> list[SceneObject]:
    if not GENAI_API_KEY:
        print("Error: GEMINI_API_KEY not found.")
        return []

    model = genai.GenerativeModel(model_name)
    
    prompt = f"""
    Generate a 3D workshop layout for: "{topic}". 
    Return a JSON array of objects with types 'box', 'cylinder', 'sticky_note', 'screen'. 
    Each object needs: type, title, color, pos{{x,y,z}}, size{{w,h,d,r}}, rot{{x,y,z}}.
    Ensure the JSON is raw and valid.
    """
    
    try:
        response = await model.generate_content_async(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        data = json.loads(response.text)
        return data
    except Exception as e:
        print(f"Gemini Error: {e}")
        return []

async def process_app_request(mode: str, input_text: str, model_name: str = "gemini-1.5-flash") -> str:
    if not GENAI_API_KEY:
        return "Error: Backend API Key missing."

    # Validate/Map model names to actual Gemini names
    gemini_model = "gemini-1.5-flash"
    if model_name == "gemini-pro": gemini_model = "gemini-1.5-pro"
    elif model_name == "imagen-3": gemini_model = "imagen-3" # Placeholder if supported
    
    model = genai.GenerativeModel(gemini_model)
    
    system_instruction = f"""
    You are an AI assistant integrated into a VR workspace. 
    Provide responses suitable for a 3D environment based on the current app mode ({mode}). 
    If mode is MAIL, draft or summarize emails. 
    If DOCS, generate document content or spreadsheets. 
    If DASHBOARD, provide high-level insights.
    """
    
    # Note: 1.5 Flash supports system instructions via model creation, but simpler to just prepend for now or use system_instruction arg if supported by lib version.
    # We will prepend for robustness.
    full_prompt = f"{system_instruction}\n\nUser Request: {input_text}"

    try:
        response = await model.generate_content_async(full_prompt)
        return response.text
    except Exception as e:
        print(f"Gemini App Request Error: {e}")
        return "Error processing request."
