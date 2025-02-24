import { getAIModelPath } from "../pathResolver.js";
import { getLlama, LlamaChatSession } from 'node-llama-cpp';
import * as path from 'path';

export async function runAI() {
    try {
        const aiModelPath = getAIModelPath();
        console.log("AI Model Path:", aiModelPath);

        const llama = await getLlama();
        const model = await llama.loadModel({
            modelPath: path.join(aiModelPath, "llama-3.2-3b-instruct.Q2_K.gguf"),
        });

        const context = await model.createContext();
        const session = new LlamaChatSession({ contextSequence: context.getSequence() });

        const response1 = await session.prompt("Hi there, how are you?");
        console.log("AI Response:", response1);

        const response2 = await session.prompt("Give me a python code for Binary Search");
        console.log("AI Code Suggestion:", response2);
    } catch (error) {
        console.error("AI Error:", error instanceof Error ? error.message : "Unknown error");
    }
}