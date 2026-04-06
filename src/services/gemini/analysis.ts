import { Type, Schema } from "@google/genai";
import { getAI, AGENT_SYSTEM_INSTRUCTION } from "./config";
import { ImportAnalysis } from "./types";
import { isQuotaError } from "./utils";

export async function analyzeImport(productName: string, country: string, language: string = 'English'): Promise<ImportAnalysis> {
  const ai = getAI();
  const prompt = `
    I want to import "${productName}" from China to "${country}".
    Please provide a detailed analysis.
    
    Use Google Search to find current information about:
    1. The best quality and lowest price options for this product in China. Focus on finding direct factories, manufacturing hubs (e.g., Shenzhen for electronics, Yiwu for small commodities), and reputable suppliers beyond just Alibaba (e.g., Global Sources, direct factory websites).
    2. For each option, provide a detailed company profile, their specialty, and a supplier rating or reputation score (e.g., "4.5/5", "Verified Factory", "ISO Certified").
    3. Shipping costs, methods, and times from China to ${country}.
    4. Detailed import regulations, customs duties (HS Code if possible), and taxes (VAT/GST) for this specific product in ${country}.
    5. Official government or customs website links for ${country} regarding these regulations.
    
    Provide the response strictly in JSON format matching the requested schema.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      productOptions: {
        type: Type.ARRAY,
        description: "List of 2-3 best product options or direct factories found.",
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Name of the product or factory" },
            estimatedPriceRange: { type: Type.STRING, description: "Estimated price range in USD" },
            qualityNotes: { type: Type.STRING, description: "Notes on quality, materials, or manufacturing standards" },
            source: { type: Type.STRING, description: "Source platform or direct factory website" },
            supplierRating: { type: Type.STRING, description: "Supplier/Factory rating or reputation" },
            companyDetails: { type: Type.STRING, description: "Detailed info about the company, its size, specialty, and location in China." }
          },
          required: ["name", "estimatedPriceRange", "qualityNotes", "source", "supplierRating", "companyDetails"]
        }
      },
      shippingDetails: {
        type: Type.OBJECT,
        description: "Details about shipping the product from China to the destination country.",
        properties: {
          isAllowed: { type: Type.BOOLEAN, description: "Is it generally allowed to import this product to the destination country?" },
          restrictions: { type: Type.STRING, description: "Any specific customs restrictions, required certifications, or duties." },
          estimatedCostRange: { type: Type.STRING, description: "Estimated shipping cost range in USD" },
          methods: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Available shipping methods (e.g., Air Freight, Sea Freight, Express)"
          },
          estimatedTime: { type: Type.STRING, description: "Estimated shipping time" }
        },
        required: ["isAllowed", "restrictions", "estimatedCostRange", "methods", "estimatedTime"]
      },
      customsAndTaxes: {
        type: Type.OBJECT,
        description: "Detailed information about customs duties, taxes, and regulations.",
        properties: {
          duties: { type: Type.STRING, description: "Detailed information about customs duties and HS codes." },
          taxes: { type: Type.STRING, description: "Information about VAT, GST, or other import taxes." },
          regulations: { type: Type.STRING, description: "Specific import regulations or required permits." },
          officialLinks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                url: { type: Type.STRING }
              },
              required: ["title", "url"]
            }
          }
        },
        required: ["duties", "taxes", "regulations", "officialLinks"]
      },
      costBreakdown: {
        type: Type.ARRAY,
        description: "A rough breakdown of all costs involved.",
        items: {
          type: Type.OBJECT,
          properties: {
            item: { type: Type.STRING, description: "Cost item (e.g., Product Cost, Shipping, Customs Duty)" },
            estimatedCost: { type: Type.STRING, description: "Estimated cost or percentage" }
          },
          required: ["item", "estimatedCost"]
        }
      },
      stepByStepGuide: {
        type: Type.ARRAY,
        description: "Step-by-step guide from ordering in China to receiving at the doorstep.",
        items: {
          type: Type.OBJECT,
          properties: {
            step: { type: Type.INTEGER },
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["step", "title", "description"]
        }
      },
      summary: { type: Type.STRING, description: "A brief overall summary and recommendation." }
    },
    required: ["productOptions", "shippingDetails", "customsAndTaxes", "costBreakdown", "stepByStepGuide", "summary"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: AGENT_SYSTEM_INSTRUCTION(language),
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text) as ImportAnalysis;
  } catch (error: any) {
    console.error("Error analyzing import:", error);
    if (isQuotaError(error)) {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw error;
  }
}
