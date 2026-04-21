import { json, error } from "@sveltejs/kit";
import { requireSession } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { paper, reference, job } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import {
  getVectorStore,
  getLlm,
  SummarySchema,
  checkLlmHealth,
} from "$lib/server/llm";
import { activeJobs } from "$lib/server/upload-jobs";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { PDFParse } from "pdf-parse";
import fs from "fs/promises";
import path from "path";
import type { RequestHandler } from "@sveltejs/kit";

const PROMPT_PATH = path.resolve("default-prompts", "summarize.txt");
const systemPrompt = await fs.readFile(PROMPT_PATH, "utf-8");

const CHUNK_PROMPT_PATH = path.resolve(
  "default-prompts",
  "chunk-summarize.txt",
);
const chunkSystemPrompt = await fs.readFile(CHUNK_PROMPT_PATH, "utf-8");

const SUMMARIZE_CHUNK_THRESHOLD = 60000;

class AbortedError extends Error {}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw new AbortedError();
}

async function processUpload(
  jobId: string,
  paperId: string,
  userId: string,
  file: File,
  fileBuffer: ArrayBuffer,
  signal: AbortSignal,
) {
  try {
    throwIfAborted(signal);

    const healthy = await checkLlmHealth();
    if (!healthy) {
      await db
        .update(job)
        .set({ status: "failed", error: "LLM service unavailable" })
        .where(eq(job.id, jobId));
      return;
    }

    throwIfAborted(signal);

    // Extract text from PDF
    const buffer = Buffer.from(fileBuffer);
    const parser = new PDFParse({ data: buffer });
    let paperText: string;
    try {
      const textResult = await parser.getText();
      paperText = textResult.text;
      paperText = paperText.replace(/--\s*\d+\s*of\s*\d+\s*--/g, "");
    } finally {
      await parser.destroy();
    }

    throwIfAborted(signal);

    // Update job status to processing
    await db.update(job).set({ status: "processing" }).where(eq(job.id, jobId));

    // Summarize
    const llm = getLlm();
    let summaryText = paperText;

    if (paperText.length >= SUMMARIZE_CHUNK_THRESHOLD) {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 12000,
        chunkOverlap: 500,
      });
      const chunks = await splitter.splitText(paperText);

      const chunkSummaries: string[] = [];
      for (const chunk of chunks) {
        throwIfAborted(signal);
        const chunkPrompt = ChatPromptTemplate.fromMessages([
          ["system", chunkSystemPrompt],
          ["human", "{chunk}"],
        ]);
        const chunkMessages = await chunkPrompt.formatMessages({ chunk });
        const response = await llm.invoke(chunkMessages);
        chunkSummaries.push(response.content as string);
      }

      summaryText = chunkSummaries.join("\n\n");
    }

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "{systemPrompt}"],
      ["human", "{summaryText}"],
    ]);
    const chain = prompt.pipe(llm.withStructuredOutput(SummarySchema));
    const result = await chain.invoke({ systemPrompt, summaryText });

    // Update paper row with summary data
    await db
      .update(paper)
      .set({
        summary: result.summary,
        keyFindings: JSON.stringify(result.key_findings),
        methodology: result.methodology,
        limitations: result.limitations,
      })
      .where(eq(paper.id, paperId));

    // Save references
    if (result.references.length > 0) {
      await db.insert(reference).values(
        result.references.map((text) => ({
          id: crypto.randomUUID(),
          paperId,
          text,
        })),
      );
    }

    throwIfAborted(signal);

    // Vectorize — split and index
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const docs = await splitter.splitDocuments([
      new Document({
        pageContent: paperText,
        metadata: { source: file.name, paperId },
      }),
    ]);

    const vectorStore = await getVectorStore();
    try {
      await vectorStore.addDocuments(docs);
    } finally {
      await vectorStore.end();
    }

    // Update job to done
    await db.update(job).set({ status: "done" }).where(eq(job.id, jobId));
  } catch (err) {
    if (err instanceof AbortedError) {
      await db
        .update(job)
        .set({ status: "cancelled" })
        .where(eq(job.id, jobId));
      return;
    }
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await db
      .update(job)
      .set({ status: "failed", error: errorMessage })
      .where(eq(job.id, jobId));
  } finally {
    // Clean up the abort controller from the map
    activeJobs.delete(jobId);
  }
}

export const POST: RequestHandler = async ({ request }) => {
  const session = await requireSession(request.headers);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file || file.type !== "application/pdf") error(400, "PDF file required");

  // Create paper row first (empty — summary filled in by background job)
  const paperId = crypto.randomUUID();
  await db.insert(paper).values({
    id: paperId,
    userId: session.user.id,
    name: file.name,
  });

  // Create job row linked to paper
  const jobId = crypto.randomUUID();
  await db.insert(job).values({
    id: jobId,
    userId: session.user.id,
    status: "pending",
    paperId,
  });

  // Start processing in background (no await)
  const fileBuffer = await file.arrayBuffer();
  const controller = new AbortController();
  activeJobs.set(jobId, controller);

  processUpload(
    jobId,
    paperId,
    session.user.id,
    file,
    fileBuffer,
    controller.signal,
  ).catch((err) => {
    console.error("Background upload failed:", err);
  });

  // Return immediately with job ID and paper ID
  return json({ jobId, paperId });
};
