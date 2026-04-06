import { Type, Schema } from "@google/genai";
import { getAI } from "./config";
import { isQuotaError } from "./utils";

export interface HSCodeResult {
  productName: string;
  hscode: string;
  description: string;
  dutyRate: string;
  notes: string;
  confidence: string;
}

export async function findHSCode(productName: string, country: string, language: string = 'English'): Promise<HSCodeResult> {
  const ai = getAI();
  const prompt = `
    Find the most accurate Harmonized System (HS) Code for the product: "${productName}" 
    specifically for import into: "${country}".
    
    IMPORTANT: Provide all text descriptions and notes in ${language}.
    
    Use Google Search to find current HS Code classifications, duty rates, and official customs guidance for ${country}.
    
    Provide the response strictly in JSON format matching the requested schema.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      productName: { type: Type.STRING },
      hscode: { type: Type.STRING, description: "The 6-10 digit HS Code" },
      description: { type: Type.STRING, description: "Official description for this code" },
      dutyRate: { type: Type.STRING, description: "Estimated duty rate for this code in the destination country" },
      notes: { type: Type.STRING, description: "Important classification notes or requirements" },
      confidence: { type: Type.STRING, description: "Confidence level (e.g., High, Medium, Low)" }
    },
    required: ["productName", "hscode", "description", "dutyRate", "notes", "confidence"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text) as HSCodeResult;
  } catch (error: any) {
    console.error("Error finding HS Code:", error);
    if (isQuotaError(error)) {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw error;
  }
}
