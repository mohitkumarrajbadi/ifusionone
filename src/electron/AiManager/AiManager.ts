import { getAIModelPath } from "../pathResolver.js";
import { getLlama, LlamaChatSession } from "node-llama-cpp";
import * as path from "path";

// Cached instance of the chat session.
let session: LlamaChatSession | null = null;

// Cache the initialization promise to avoid parallel initializations.
let initPromise: Promise<void> | null = null;

/**
 * Initializes the AI model and chat session.
 *
 * This function loads the model using the path from getAIModelPath() and creates
 * a chat session for further interactions. It uses a cached promise to ensure that
 * multiple calls do not trigger parallel initializations.
 *
 * @returns {Promise<void>} Resolves when the AI model is successfully loaded.
 * @throws Will throw an error if initialization fails.
 *
 * @see https://node-llama-cpp.withcat.ai/guide/chat-session
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
            });

            const context = await model.createContext();
            session = new LlamaChatSession({ contextSequence: context.getSequence() });

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
 * Sends a prompt to the AI model using a chain-of-thought approach and returns the formatted final answer.
 *
 * The function instructs the model to first generate its chain-of-thought reasoning and then output the final answer
 * on a new line starting with "Final Answer:". It then extracts the final answer from the response.
 *
 * @param {string} prompt - The user prompt.
 * @returns {Promise<string>} The AI model's final response.
 * @throws Will throw an error if the session is not initialized.
 *
 * @see https://node-llama-cpp.withcat.ai/guide/chat-session
 */
export async function chatWithAI(prompt: string): Promise<string> {
    if (!session) {
        throw new Error("AI session not initialized. Call initializeAI first.");
    }
    try {
        // Construct a prompt that instructs the model to generate chain-of-thought reasoning
        // followed by a final answer marked with "Final Answer:".
        const chainPrompt = `Please think through the problem step by step.
Provide your chain-of-thought reasoning first, then output the final answer on a new line starting with "Final Answer:".

Example:
---
Chain-of-Thought: [Detailed reasoning goes here...]
Final Answer: [Concise final answer goes here...]
---
Now, respond to the following prompt:
${prompt}`;

        const fullResponse = await session.prompt(chainPrompt);

        // Extract the final answer using the delimiter.
        const delimiter = "Final Answer:";
        const delimiterIndex = fullResponse.indexOf(delimiter);
        let formattedResponse = "";
        if (delimiterIndex !== -1) {
            formattedResponse = fullResponse.substring(delimiterIndex + delimiter.length).trim();
        } else {
            // Fallback if the delimiter is not found.
            formattedResponse = fullResponse.trim();
        }

        return formattedResponse;
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        console.error("AI Chat Error:", errMsg);
        return "Error processing request.";
    }
}
