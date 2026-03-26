import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import { LlamaClient } from './LlamaClient';

const { LLAMA_URL, PDF_URL, PROMPT_URL } = process.env;

async function main(): Promise<void> {
  const parser = new PDFParse({ url: PDF_URL! });
  const { text: paperText } = await parser.getText();
  const prompt = await fs.readFile(PROMPT_URL!, { encoding: 'utf-8' });

  const llama = new LlamaClient(LLAMA_URL!);

  const tokenCount = await llama.countTokens(prompt + paperText);
  console.log(`[tokens] input: ${tokenCount}`);

  let result = await llama.complete(
    [
      { role: 'system', content: prompt },
      { role: 'user', content: paperText },
    ],
    'qwen3',
    6000,
  );

  // Strip JSON backticks before parsing
  result = result.replace(/```json|```/g, '').trim();
  console.log(JSON.parse(result));
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
