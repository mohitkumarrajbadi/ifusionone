// AiManager.ts
import { getLlama, LlamaChatSession } from "node-llama-cpp";
import * as path from "path";
import fs from "fs/promises";
import { getAIModelPath } from "../../pathResolver.js";

// Constants for conversation management.
const CONTEXT_THRESHOLD = 10; // Number of messages before resetting.

export class AIChatManager {
  private static instance: AIChatManager;
  private session: LlamaChatSession | null = null;
  private messageCount = 0;
  private initPromise: Promise<void> | null = null;

  // Singleton: reuse a single instance of Llama throughout the app.
  public static getInstance(): AIChatManager {
    if (!AIChatManager.instance) {
      AIChatManager.instance = new AIChatManager();
    }
    return AIChatManager.instance;
  }

  // Initializes the AI model and chat session.
  public async initialize(): Promise<void> {
    if (this.session) {
      console.log("AI model already initialized.");
      return;
    }
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      // try {
      //   const aiModelPath = getAIModelPath();
      //   console.log("Initializing AI Model at:", aiModelPath);

      //   const llama = await getLlama();
      //   const model = await llama.loadModel({
      //     modelPath: path.join(aiModelPath, "llama-3.2-3b-instruct.Q2_K.gguf"),
      //     defaultContextFlashAttention: true,
      //   });
      //   const context = await model.createContext();
      //   this.session = new LlamaChatSession({ contextSequence: context.getSequence() });
      //   this.messageCount = 0;
      //   console.log("AI model loaded successfully.");
      // } catch (error) {
      //   const errMsg = error instanceof Error ? error.message : "Unknown error";
      //   console.error("AI Initialization error:", errMsg);
      //   throw new Error(`AI Initialization failed: ${errMsg}`);
      // }
    }
  )
    ();

    return this.initPromise;
  }

  // Sends a prompt to the AI model and returns the trimmed response.
  public async chat(prompt: string): Promise<string> {
    // if (!this.session) {
    //   throw new Error("AI session not initialized. Call initialize() first.");
    // }

    // // Increment and check the message count.
    // if (++this.messageCount > CONTEXT_THRESHOLD) {
    //   console.log("Context threshold reached. Resetting AI session.");
    //   await this.resetSession();
    // }

    // try {
    //   const response = await this.session.prompt(prompt);
    //   console.log (`AI Response: ${response}`);
    //   return response.trim();
    // } catch (error) {
    //   const errMsg = error instanceof Error ? error.message : "Unknown error";
    //   console.error("AI Chat error:", errMsg);
    //   return "Error processing request.";
    // }
    return "Error processing request.";
  }

  // Resets the current session by summarizing the conversation and reinitializing.
  public async resetSession(): Promise<void> {
    if (!this.session) {
      console.warn("No active session to reset.");
      return;
    }

    try {
      const summary = await this.summarizeContext();
      console.log("Resetting session with summary:", summary);

      // Dispose the current session and its dependent objects.
      this.session.dispose();
      this.session = null;

      // Reset initialization promise and reinitialize.
      this.initPromise = null;
      await this.initialize();

      // Prime the new session with the summary.
      await this.session!.prompt(`Conversation summary: ${summary}`);
      this.messageCount = 1;
    } catch (error) {
      console.error("Error resetting AI session:", error);
      throw error;
    }
  }

  // Closes the current AI session and frees resources immediately.
  public async close(): Promise<void> {
    if (!this.session) {
      console.warn("No active session to close.");
      return;
    }
    try {
      await this.session.dispose();
      this.session = null;
      this.messageCount = 0;
      console.log("AI session closed.");
    } catch (error) {
      console.error("Error closing AI session:", error);
      throw error;
    }
  }

  // Stub: Summarizes conversation history.
  // Replace with a proper summarization implementation.
  private async summarizeContext(): Promise<string> {
    return "Summary of previous conversation...";
  }

  // Saves the chat history to a file.
  public async saveChatHistory(filePath: string): Promise<void> {
    if (!this.session) {
      throw new Error("Session not initialized.");
    }
    const chatHistory = this.session.getChatHistory();
    await fs.writeFile(filePath, JSON.stringify(chatHistory), "utf8");
    console.log("Chat history saved.");
  }

  // Restores chat history from a file.
  public async restoreChatHistory(filePath: string): Promise<void> {
    if (!this.session) {
      throw new Error("Session not initialized.");
    }
    const data = await fs.readFile(filePath, "utf8");
    const chatHistory = JSON.parse(data);
    this.session.setChatHistory(chatHistory);
    console.log("Chat history restored.");
  }

  // Preloads a prompt onto the context sequence state.
  public async preloadPrompt(prompt: string): Promise<void> {
    if (!this.session) {
      throw new Error("Session not initialized.");
    }
    await this.session.preloadPrompt(prompt);
    console.log("Prompt preloaded.");
  }

  // Completes a prompt using a prompt completion engine.
  // Removed the options argument since the API expects a single argument.
  public async completePrompt(prompt: string): Promise<string> {
    if (!this.session) {
      throw new Error("Session not initialized.");
    }
    const engine = this.session.createPromptCompletionEngine({
      maxPreloadTokens: 15,
      onGeneration: (p, completion) => {
        console.log(`Prompt: ${p} | Completion: ${completion}`);
      },
    });
    // Call complete with one argument, per the API signature.
    return engine.complete(prompt);
  }
}

export default AIChatManager.getInstance();
