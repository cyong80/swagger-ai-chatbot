import type { ILLMAdapter } from "../types";

export const OpenAIAdapter: ILLMAdapter = {
  provider: "openai",

  async ask({ key, messages, maxOutputTokens }) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: maxOutputTokens,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };

    if (data.error) throw new Error(data.error.message);
    return data.choices?.[0]?.message?.content ?? "";
  },
};
