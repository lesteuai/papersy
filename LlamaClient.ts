import OpenAI from 'openai';

export class LlamaClient {
  private client: OpenAI;
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.client = new OpenAI({
      apiKey: 'dummy',
      baseURL: `${baseURL}/v1`,
    });
  }

  async countTokens(text: string): Promise<number> {
    const res = await fetch(`${this.baseURL}/tokenize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    });
    const data = await res.json() as { tokens: number[] };
    return data.tokens.length;
  }

  async complete(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    model: string,
    maxTokens: number,
  ): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model,
      max_completion_tokens: maxTokens,
      messages,
    });
    return completion.choices[0].message.content as string;
  }
}
