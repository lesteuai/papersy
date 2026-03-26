import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import OpenAI from 'openai';

async function main() {
  const parser = new PDFParse({ url: './report.pdf' });
  const { text: paperText } = await parser.getText();

  const promptTemplate = fs.readFileSync('./summarize_prompt.txt', 'utf-8');
  const prompt = promptTemplate.replace('[INSERT PAPER TEXT HERE]', paperText);

  const client = new OpenAI({
    apiKey: 'dummy',
    baseURL: 'http://localhost:8033/v1',
  });

  const completion = await client.chat.completions.create({
    model: 'qwen3',
    messages: [{ role: 'user', content: prompt }],
  });

  let result = completion.choices[0].message.content as string;

  // Strip JSON backticks before parsing
  result = result.replace(/```json|```/g, "").trim();

  console.log(result as string);
}

main();
