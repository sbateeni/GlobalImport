import { getAI, AGENT_SYSTEM_INSTRUCTION } from "./config";
import { ImportAnalysis } from "./types";
import { isQuotaError } from "./utils";

export async function chatFollowUp(
  message: string, 
  history: { role: 'user' | 'model', text: string }[], 
  context: ImportAnalysis,
  language: string = 'English'
): Promise<string> {
  const ai = getAI();
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `
        ${AGENT_SYSTEM_INSTRUCTION(language)}
        
        The user has already received an import analysis for a product.
        Here is the context of that analysis: ${JSON.stringify(context)}.
        Answer the user's follow-up questions based on this context and your general knowledge.
      `,
    },
  });

  // Convert history to Gemini format
  const contents = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.text }]
  }));

  try {
    const response = await chat.sendMessage({
      message: message
    });
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error: any) {
    console.error("Error in chat follow-up:", error);
    if (isQuotaError(error)) {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw error;
  }
}
