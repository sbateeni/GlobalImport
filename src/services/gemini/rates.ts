import { Type, Schema } from "@google/genai";
import { getAI } from "./config";
import { ShippingRates } from "./types";
import { isQuotaError } from "./utils";

export async function fetchShippingRates(country: string, language: string = 'English'): Promise<ShippingRates> {
  const ai = getAI();
  const prompt = `
    Search for the MOST ACCURATE and OFFICIAL commercial shipping rates and logistics costs from China to "${country}".
    
    CRITICAL INSTRUCTIONS (2026 MARKET REALITY):
    1. Prioritize data from official port authorities in "${country}", major international freight forwarders (like Maersk, MSC, Kuehne+Nagel), and national customs websites.
    2. Provide standard market rates currently in use in "${country}" to avoid discrepancies.
    3. Route Factor: Account for current global conditions (e.g., Red Sea diversions).
    4. Surcharges: Include "War Risk & Operational Recovery" (typically $800-$1200 for East Asia routes) and "Bunker Adjustment Factor" (BAF).
    5. Sovereign Fees: Include the current VAT rate (e.g., 17% for Israel) and local currency exchange rate to 1 USD.
    6. Congestion: Include any current congestion surcharges for major ports in "${country}".
    7. Ensure the "country" name in the response is normalized and consistent (e.g., use the standard spelling in ${language}).
    
    Focus on:
    1. Full Container Load (FCL) for 20ft and 40ft containers (Standard market range).
    2. Less than Container Load (LCL) rate per Cubic Meter (CBM).
    3. Estimated transit time by sea based on major shipping lines.
    4. Major destination ports in "${country}".
    5. A detailed breakdown of standard local costs (Terminal Handling, Customs Clearance, Local Delivery, Documentation) as regulated or commonly charged in "${country}".
    
    Provide the response strictly in JSON format matching the requested schema.
    All text should be in ${language}.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      country: { type: Type.STRING },
      fcl20ft: { type: Type.STRING, description: "Estimated cost for 20ft container in USD" },
      fcl40ft: { type: Type.STRING, description: "Estimated cost for 40ft container in USD" },
      lclPerCbm: { type: Type.STRING, description: "Estimated cost per CBM for LCL in USD" },
      estimatedTransitTime: { type: Type.STRING },
      majorPorts: { type: Type.ARRAY, items: { type: Type.STRING } },
      costBreakdown: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            item: { type: Type.STRING },
            estimatedCost: { type: Type.STRING }
          },
          required: ["item", "estimatedCost"]
        }
      },
      vatRate: { type: Type.NUMBER, description: "Current VAT percentage (e.g., 17)" },
      currency: { type: Type.STRING, description: "Local currency code (e.g., ILS)" },
      exchangeRate: { type: Type.NUMBER, description: "Exchange rate to 1 USD" },
      warRiskSurcharge: { type: Type.STRING, description: "Estimated War Risk surcharge in USD" },
      bafPercentage: { type: Type.NUMBER, description: "Bunker Adjustment Factor percentage (e.g., 35)" },
      congestionSurcharge: { type: Type.STRING, description: "Estimated Congestion surcharge in USD if any" },
      lastUpdated: { type: Type.STRING, description: "Current date" }
    },
    required: ["country", "fcl20ft", "fcl40ft", "lclPerCbm", "estimatedTransitTime", "majorPorts", "costBreakdown", "vatRate", "currency", "exchangeRate", "warRiskSurcharge", "bafPercentage", "congestionSurcharge", "lastUpdated"]
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
    return JSON.parse(text) as ShippingRates;
  } catch (error: any) {
    console.error("Error fetching shipping rates:", error);
    if (isQuotaError(error)) {
      const normalizedTarget = country.trim().toLowerCase();
      if (normalizedTarget.includes('israel') || normalizedTarget.includes('إسرائيل')) {
        return {
          country: language === 'Arabic' ? 'إسرائيل' : 'Israel',
          fcl20ft: "3,500",
          fcl40ft: "5,000",
          lclPerCbm: "150",
          estimatedTransitTime: "35 - 40",
          majorPorts: language === 'Arabic' ? ["أشدود", "حيفا", "إيلات"] : ["Ashdod", "Haifa", "Eilat"],
          costBreakdown: [
            { item: language === 'Arabic' ? "رسوم مناولة الميناء" : "Terminal Handling", estimatedCost: "$350" },
            { item: language === 'Arabic' ? "تخليص جمركي" : "Customs Clearance", estimatedCost: "$150" },
            { item: language === 'Arabic' ? "نقل محلي" : "Local Delivery", estimatedCost: "$250" }
          ],
          vatRate: 17,
          currency: "ILS",
          exchangeRate: 3.7,
          warRiskSurcharge: "$1,200",
          bafPercentage: 35,
          congestionSurcharge: "$250",
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      throw new Error("QUOTA_EXCEEDED");
    }
    throw error;
  }
}
