import type { ILLMAdapter } from "../types";

export const ClaudeAdapter: ILLMAdapter = {
  provider: "claude",

  async ask({ key, messages, maxOutputTokens }) {
    const systemMsg = messages.find((m) => m.role === "system");
    const chatMsgs = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "dangerously-allow-browser": "true",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: maxOutputTokens,
        system: systemMsg?.content ?? "",
        messages: chatMsgs,
      }),
    });

    const data = (await res.json()) as {
      content?: { text?: string }[];
      error?: { message?: string };
    };

    if (data.error) throw new Error(data.error.message);
    return data.content?.[0]?.text ?? "";
  },
};
