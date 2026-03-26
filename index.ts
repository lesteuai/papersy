import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import OpenAI from 'openai';

const OPENAI_URL = 'http://localhost:8033/v1';
const PDF_URL = './report.pdf';
const PROMPT_URL = './summarize_prompt.txt';

async function main() {
  // Import the PDF and system prompt
  const parser = new PDFParse({ url: PDF_URL });
  const { text: paperText } = await parser.getText();
  const prompt = await fs.readFile(PROMPT_URL, {encoding: 'utf-8'});
  const client = new OpenAI({
    apiKey: 'dummy',
    baseURL: OPENAI_URL,
  });

  const completion = await client.chat.completions.create({
    model: 'qwen3',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: paperText }
    ],
  });
  let result = completion.choices[0].message.content as string;

  // Strip JSON backticks before parsing
  result = result.replace(/```json|```/g, "").trim();
  
  console.log(JSON.parse(result));
}

let count = 0;
async function loop() {
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
