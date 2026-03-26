import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import OpenAI from 'openai';

const OPENAI_URL = 'http://localhost:8033';
const PDF_URL = './report.pdf';
const PROMPT_URL = './summarize_prompt.txt';

async function countTokens(text: string): Promise<number> {
  const res = await fetch(`${OPENAI_URL}/tokenize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: text }),
  });
  const data = await res.json() as { tokens: number[] };
  return data.tokens.length;
}

async function main(): Promise<void> {
  // Import the PDF and system prompt
  const parser = new PDFParse({ url: PDF_URL });
  const { text: paperText } = await parser.getText();

  const prompt = await fs.readFile(PROMPT_URL, {encoding: 'utf-8'});
  const tokenCount = await countTokens(prompt + paperText);

  const client = new OpenAI({
    apiKey: 'dummy',
    baseURL: `${OPENAI_URL}/v1`,
  });

  const completion = await client.chat.completions.create({
    model: 'qwen3',
    max_completion_tokens: 6000,
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: paperText }
    ],
  });
  let result = completion.choices[0].message.content as string;

  // Strip JSON backticks before parsing
  result = result.replace(/```json|```/g, "").trim();
  console.log(JSON.parse(result));
  console.log(`[tokens] input: ${tokenCount}`);

}

let count = 0;
async function loop(): Promise<void> {
  while (true) {
    count += 1;
    console.log(`\n[${count}]:`);
      try {
      await main();
    } catch (e) {
      console.log('[parse error]:', e);
    }
  }
}

loop()
