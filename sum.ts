import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';

const SummarySchema = z.object({
  summary: z.string().describe('Concise summary of the paper in 3-5 sentences covering objective, methodology, and findings'),
  key_findings: z.array(z.string()).length(3).describe('Exactly 3 most important insights or contributions, each 1-2 sentences'),
  references: z.array(z.string()).describe('All references extracted from the paper, without leading numeric labels. Empty array if none found.'),
  methodology: z.string().describe('Summary of how the study was conducted (2-4 sentences), or exactly "No methodology section found." if no Methodology/Methods section exists'),
  limitations: z.string().describe('Summary of stated limitations (2-4 sentences), or exactly "No limitations section found." if no Limitations section exists'),
});

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

  const chain = prompt.pipe(llm.withStructuredOutput(SummarySchema));

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
