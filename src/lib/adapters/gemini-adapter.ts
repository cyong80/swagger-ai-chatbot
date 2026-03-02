import type { ILLMAdapter } from "../types";

interface GeminiMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export const GeminiAdapter: ILLMAdapter = {
  provider: "gemini",

  async ask({ key, messages, maxOutputTokens }) {
    const geminiContents: GeminiMessage[] = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const systemInstruction = messages.find((m) => m.role === "system")?.content;

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          contents: geminiContents,
          systemInstruction: systemInstruction
            ? { parts: [{ text: systemInstruction }] }
            : undefined,
          generationConfig: { maxOutputTokens },
        }),
      }
    );

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      error?: { message?: string };
    };

    if (data.error) throw new Error(data.error.message);
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  },
};
