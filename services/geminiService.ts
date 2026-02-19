
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResponse, ItemConfig, DayData } from "../types";

export async function analyzeDailySales(
  items: ItemConfig[],
  dayData: DayData,
  lang: 'EN' | 'BN'
): Promise<AIAnalysisResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Only include items that actually had sales to keep prompt concise and relevant
  const soldItems = items.filter(item => {
    const q = dayData.quantities[item.id] || { q250: 0, q350: 0 };
    return q.q250 > 0 || q.q350 > 0;
  });

  const salesContext = soldItems.map(item => {
    const q = dayData.quantities[item.id] || { q250: 0, q350: 0 };
    return `${item.name}: 250ml x ${q.q250}, 350ml x ${q.q350}`;
  }).join(", ") || "No sales recorded today.";

  const prompt = `
    You are a professional business consultant for a premium Smoothie Bar. 
    Analyze the following daily sales data and provide a strategic summary.
    
    Sales Data: ${salesContext}
    Total Purchases: ${dayData.purchase}
    Total Expenses: ${dayData.expense}
    Opening Balance: ${dayData.previousBalance}
    
    Instructions:
    - Provide a high-level business insight about the sales performance.
    - Provide a specific, actionable suggestion to increase revenue for tomorrow.
    - Create a short, punchy marketing hook for social media (Instagram/FB) targeting today's best-selling flavor.
    - Language: Please respond exclusively in ${lang === 'EN' ? 'English' : 'Bengali'}.
    - Format: Return strictly as a JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
        topP: 0.95,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insight: { 
              type: Type.STRING,
              description: "A professional business insight about the performance."
            },
            suggestion: { 
              type: Type.STRING,
              description: "An actionable suggestion for improvement."
            },
            marketingHook: { 
              type: Type.STRING,
              description: "A creative social media hook."
            },
          },
          required: ["insight", "suggestion", "marketingHook"],
          propertyOrdering: ["insight", "suggestion", "marketingHook"]
        },
      },
    });

    const text = response.text;
    if (text) {
      // Robust JSON parsing
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText) as AIAnalysisResponse;
    }
    throw new Error("No text response from Gemini");
  } catch (error) {
    console.error("Gemini Magic Link Analysis failed:", error);
    // Fallback response so the user isn't stuck
    return {
      insight: lang === 'BN' 
        ? "আজকের বিক্রয়ের ভিত্তিতে আপনার ব্যবসা স্থিতিশীল রয়েছে।" 
        : "Based on today's data, your business performance remains steady.",
      suggestion: lang === 'BN'
        ? "আগামীকাল বেশি বিক্রিত ফ্লেভারের স্টক বাড়িয়ে রাখুন।"
        : "Consider increasing stock of your top-selling flavors for tomorrow.",
      marketingHook: lang === 'BN'
        ? "তাজা ফলের স্মুদিতে নিজেকে রিফ্রেশ করুন আজই!"
        : "Refresh yourself with our best-selling fresh fruit smoothies today!"
    };
  }
}
