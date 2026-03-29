import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';

const { LLAMA_URL, PDF_URL, PROMPT_URL } = process.env;

async function countTokens(text: string): Promise<number> {
  const res = await fetch(`${LLAMA_URL}/tokenize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: text }),
  });
  const data = await res.json() as { tokens: number[] };
  return data.tokens.length;
}

async function main(): Promise<void> {
  const parser = new PDFParse({ url: PDF_URL! });
  const { text: paperText } = await parser.getText();
  const systemPrompt = await fs.readFile(PROMPT_URL!, { encoding: 'utf-8' });

  const tokenCount = await countTokens(systemPrompt + paperText);
  console.log(`[tokens] input: ${tokenCount}`);

  const llm = new ChatOpenAI({
    model: 'qwen3',
    maxTokens: 6000,
    configuration: {
      baseURL: `${LLAMA_URL}/v1`,
      apiKey: 'dummy',
    },
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', '{systemPrompt}'],
    ['human', '{paperText}'],
  ]);

  const chain = prompt.pipe(llm).pipe(new JsonOutputParser());

  const result = await chain.invoke({ systemPrompt, paperText });
  console.log(result);
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

loop();
