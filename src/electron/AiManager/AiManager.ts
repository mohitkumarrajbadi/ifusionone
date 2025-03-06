import { getAIModelPath } from "../pathResolver.js";
import { getLlama, LlamaChatSession } from "node-llama-cpp";
import * as path from "path";

// Cached instance of the chat session.
let session: LlamaChatSession | null = null;
// Counter to track the conversation length.
let messageCount = 0;
// Promise to avoid multiple parallel initializations.
let initPromise: Promise<void> | null = null;

const CONTEXT_THRESHOLD = 10; // Maximum messages before summarizing.

/**
 * Summarizes the conversation history.
 * Replace this stub with an actual summarization routine.
 */
async function summarizeContext(): Promise<string> {
  // In practice, you would extract previous messages and summarize them.
  return "Summary of previous conversation...";
}

/**
 * Initializes the AI model and chat session.
 */
export async function initializeAI(): Promise<void> {
  if (session) {
    console.log("AI Model already initialized.");
    return;
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const aiModelPath = getAIModelPath();
      console.log("Initializing AI Model at:", aiModelPath);

      const llama = await getLlama();
      const model = await llama.loadModel({
        modelPath: path.join(aiModelPath, "llama-3.2-3b-instruct.Q2_K.gguf"),
        defaultContextFlashAttention: true,
      });

      const context = await model.createContext();
      session = new LlamaChatSession({ contextSequence: context.getSequence() });
      messageCount = 0; // Reset the counter

      console.log("AI Model Loaded Successfully.");
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("AI Initialization Error:", errMsg);
      throw new Error(`AI Initialization failed: ${errMsg}`);
    }
  })();

  return initPromise;
}

/**
 * Sends a prompt to the AI model and returns the response.
 * This function includes logic to summarize and reinitialize the session
 * if the conversation grows too long.
 */
export async function chatWithAI(prompt: string): Promise<string> {
  if (!session) {
    throw new Error("AI session not initialized. Call initializeAI first.");
  }

  // If message count exceeds threshold, summarize and reinitialize the session.
  if (++messageCount > CONTEXT_THRESHOLD) {
    console.log("Context threshold reached. Summarizing and reinitializing session.");
    const summary = await summarizeContext();

    // Clear the current session to free memory.
    session = null;
    await initializeAI();

    // Prime the new session with the summary.
    await session!.prompt(`The conversation so far summarized: ${summary}`);
    messageCount = 1; // Reset counter after reinitialization (include current prompt)
  }

  try {
    if (!session) {
      throw new Error("AI session not initialized. Call initializeAI first.");
    }
    const response = await session.prompt(prompt);
    return response.trim();
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("AI Chat Error:", errMsg);
    return "Error processing request.";
  }
}
