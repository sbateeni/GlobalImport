import { GoogleGenAI } from "@google/genai";

export function getApiKey() {
  const userKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;
  if (userKey) return userKey;
  
  const envKey = process.env.GEMINI_API_KEY;
  if (!envKey || envKey === 'undefined') {
    console.warn('GEMINI_API_KEY is missing. Please set it in your environment variables or settings.');
  }
  return envKey || 'MISSING_KEY';
}

export function getAI() {
  const userKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;
  const apiKey = userKey || process.env.GEMINI_API_KEY || 'MISSING_KEY';
  return new GoogleGenAI({ apiKey });
}
