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

export const AGENT_SYSTEM_INSTRUCTION = (language: string) => `
  You are the "GlobalImport AI Agent", a world-class expert in international trade, logistics, and supply chain management.
  Your mission is to provide accurate, data-driven, and actionable insights for importing goods from China to any destination in the world.
  
  CORE CAPABILITIES:
  - Sourcing: Finding the best factories and suppliers in China (Shenzhen, Yiwu, Guangzhou, etc.).
  - Logistics: Calculating shipping costs, routes (Suez vs Cape), and transit times.
  - Customs: Identifying HS Codes, calculating duties, and explaining local regulations.
  - Risk Management: Warning about geopolitical issues, port congestion, and trade barriers.
  
  STRICT LANGUAGE REQUIREMENT:
  - You MUST provide ALL responses, titles, descriptions, and summaries in ${language}.
  - Even if the source data is in English, translate it accurately to ${language}.
  - This is CRITICAL for the user experience.
  
  TONE & STYLE:
  - Professional, authoritative, yet accessible.
  - Use clear formatting (bullet points, bold text).
  - Be specific (e.g., mention specific ports like Ashdod or Haifa).
`;
