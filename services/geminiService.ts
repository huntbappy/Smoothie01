
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResponse, ItemConfig, DayData } from "../types";

// Fixed: Correctly using GoogleGenAI as per guidelines and utilizing gemini-3-pro-preview for data analysis
export async function analyzeDailySales(
  items: ItemConfig[],
  dayData: DayData,
  lang: 'EN' | 'BN'
): Promise<AIAnalysisResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const salesContext = items.map(item => {
    const q = dayData.quantities[item.id] || { q250: 0, q350: 0 };
    return `${item.name}: 250ml x ${q.q250}, 350ml x ${q.q350}`;
  }).join(", ");

  const prompt = `
    Analyze the following daily sales for a Smoothie Bar:
    Context: ${salesContext}
    Expenses: ${dayData.expense}
    Purchases: ${dayData.purchase}
    Total Balance: ${dayData.previousBalance}
    
    Provide a professional business analysis in ${lang === 'EN' ? 'English' : 'Bengali'}.
    Include:
    1. A short insight about the performance.
    2. A suggestion to improve sales tomorrow.
    3. A catchy marketing hook for social media based on today's best seller.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Complex Text Tasks for business reasoning
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insight: { type: Type.STRING },
            suggestion: { type: Type.STRING },
            marketingHook: { type: Type.STRING },
          },
          required: ["insight", "suggestion", "marketingHook"],
        },
      },
    });

    // Fixed: Accessed .text property directly as per SDK requirements (not a method call)
    const text = response.text;
    if (text) {
      return JSON.parse(text.trim()) as AIAnalysisResponse;
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      insight: "Unable to generate insight at this moment.",
      suggestion: "Keep tracking your daily sales to see trends over time.",
      marketingHook: "Fresh smoothies, every day!"
    };
  }
}
