
import { GoogleGenAI } from "@google/genai";
import { Message, Role } from "../types";

export const sendMessageToGemini = async (
  messages: Message[],
  modelName: string = 'gemini-3-flash-preview',
  onChunk: (text: string) => void,
  useThinking: boolean = false
) => {
  // Always create a new instance to ensure we have the latest API key from the environment
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Convert application message format to Gemini content format
  // We filter out messages with empty content to avoid API errors
  const contents = messages
    .filter(m => m.content.trim() !== "")
    .map(m => ({
      role: m.role === Role.ASSISTANT ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  const config: any = {
    systemInstruction: "You are integen aichat, a world-class AI specialized in providing high-quality answers to any question. You focus on being clear, helpful, and engaging in conversation. While you can understand technical topics, your primary goal is to be a brilliant conversational partner and question-answerer. Use markdown for your responses.",
  };

  // Only add thinking budget if explicitly requested and using a supported model
  if (useThinking && (modelName.includes('gemini-3') || modelName.includes('gemini-2.5'))) {
    config.thinkingConfig = { thinkingBudget: 4096 };
  }

  try {
    const streamResponse = await ai.models.generateContentStream({
      model: modelName,
      contents: contents,
      config: config
    });

    let fullText = "";
    for await (const chunk of streamResponse) {
      // Use the text property directly as per guidelines
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    
    if (!fullText) {
      console.warn("Gemini returned an empty response.");
    }
    
    return fullText;
  } catch (error) {
    console.error("Gemini API Error details:", error);
    throw error;
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize the following chat message into a very short title (max 5 words): "${message}"`,
    });
    return response.text?.trim().replace(/^"(.*)"$/, '$1') || "New Conversation";
  } catch (error) {
    console.error("Title generation error:", error);
    return "New Chat";
  }
};
