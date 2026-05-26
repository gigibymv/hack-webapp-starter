import { createVertex } from "@ai-sdk/google-vertex";
import { VertexAI } from "@google-cloud/vertexai";

/**
 * Vercel AI SDK Google Vertex AI Adapter.
 * Integrates Gemini models natively.
 * 
 * Usage:
 * import { vertex } from "@/lib/vertex";
 * import { generateText } from "ai";
 * 
 * const { text } = await generateText({
 *   model: vertex("gemini-2.5-flash"),
 *   prompt: "Analyze layout...",
 * });
 */
export const vertex = createVertex({
  project: process.env.GOOGLE_CLOUD_PROJECT || "wayfair-hackathon-2026",
  location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
});

/**
 * Canonical Google Cloud Vertex AI SDK client.
 * For advanced multimodal or low-level vision tasks.
 */
export const vertexClient = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT || "wayfair-hackathon-2026",
  location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
});
