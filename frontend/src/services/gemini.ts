import { AppMode } from '../types';



const BACKEND_URL = 'http://localhost:8000';

export const processAppRequest = async (mode: AppMode, input: string, modelName: string = 'gemini-1.5-flash'): Promise<string> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/process-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode, input, model_name: modelName }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || "I'm sorry, I couldn't process your request.";
  } catch (error) {
    console.error("Gemini processAppRequest failed:", error);
    return "Error connecting to AI Backend. Please check if backend is running.";
  }
};