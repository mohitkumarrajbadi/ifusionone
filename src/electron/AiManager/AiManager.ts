import { getAIModelPath } from "../pathResolver.js";
import { getLlama, LlamaChatSession } from "node-llama-cpp";
import * as path from "path";

let session: LlamaChatSession | null = null;

export async function initializeAI() {
    try {
        const aiModelPath = getAIModelPath();
        console.log("Initializing AI Model at:", aiModelPath);

        const llama = await getLlama();
        const model = await llama.loadModel({
            modelPath: path.join(aiModelPath, "llama-3.2-3b-instruct.Q2_K.gguf"),
        });

        const context = await model.createContext();
        session = new LlamaChatSession({ contextSequence: context.getSequence() });

        console.log("AI Model Loaded Successfully.");
    } catch (error) {
        console.error("AI Initialization Error:", error instanceof Error ? error.message : "Unknown error");
    }
}

export async function chatWithAI(prompt: string) {
    try {
        if (!session) {
            throw new Error("AI session not initialized. Call initializeAI first.");
        }

        const response = await session.prompt(prompt);
        return response;
    } catch (error) {
        console.error("AI Chat Error:", error instanceof Error ? error.message : "Unknown error");
        return "Error processing request.";
    }
}
