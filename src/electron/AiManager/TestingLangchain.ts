import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { LlamaCppEmbeddings } from "@langchain/community/embeddings/llama_cpp";
import { LlamaCpp } from "@langchain/community/llms/llama_cpp";
import { getAIModelPath } from "../pathResolver.js";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";

import * as path from "path";
import { z } from "zod";


// Define types
type ProcessedVectorStore = Promise<MemoryVectorStore>;

/**
 * Loads documents, splits them into chunks, and stores their embeddings.
 * @param {string} directoryPath - The local directory containing documents.
 * @returns {Promise<MemoryVectorStore>} - The vector store with embedded document chunks.
 */
export async function processDocuments(directoryPath: string): ProcessedVectorStore {
    try {
        // Configure the directory loader with loaders for multiple file types.
        const loader = new DirectoryLoader(directoryPath, {
            ".pdf": (filePath: string) => new PDFLoader(filePath),
            ".txt": (filePath: string) => new TextLoader(filePath),
        });

        const docs = await loader.load();
        if (!docs.length) throw new Error("No documents found in the directory.");

        // Split documents into smaller chunks.
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const splitDocs = await splitter.splitDocuments(docs);
        if (!splitDocs.length) throw new Error("Failed to split documents.");

        // Initialize embeddings model.
        const aiModelPath: string = getAIModelPath();
        const llamaEmbPath: string = path.join(aiModelPath, "llama-3.2-3b-instruct.Q2_K.gguf");

        const embeddings = await LlamaCppEmbeddings.initialize({
            modelPath: llamaEmbPath,
        });

        // Create and return the vector store.
        return await MemoryVectorStore.fromDocuments(splitDocs, embeddings);
    } catch (error) {
        console.error("Error in processDocuments:", error);
        throw error;
    }
}

/**
 * Implements a Retrieval-Augmented Generation (RAG) system.
 * @param {string} prompt - The user query.
 * @param {string} documentDirectory - The directory containing documents.
 * @returns {Promise<string>} - The AI-generated response.
 */
export async function chatLangchainRAG(prompt: string, documentDirectory: string): Promise<string> {
    try {
        // Process and embed the documents.
        const vectorStore: MemoryVectorStore = await processDocuments(documentDirectory);

        // Retrieve the top 3 document chunks most similar to the user query.
        const relevantDocs = await vectorStore.similaritySearch(prompt, 3);
        if (!relevantDocs.length) throw new Error("No relevant documents found for the query.");

        const contextText: string = relevantDocs.map(doc => doc.pageContent).join("\n");

        // Build a composite prompt.
        const compositePrompt: string = `Document context:\n${contextText}\n\nUser query:\n${prompt}`;
        console.log("Composite Prompt:", compositePrompt);

        // Initialize LlamaCpp model for inference.
        const aiModelPath: string = getAIModelPath();
        const llamaPath: string = path.join(aiModelPath, "llama-3.2-3b-instruct.Q2_K.gguf");

        const model = await LlamaCpp.initialize({
            modelPath: llamaPath,
            threads: 8, // Adjust based on your hardware.
        });

        // Generate and return the AI response.
        const response: string = await model.invoke(compositePrompt);
        console.log("AI Response:", response);
        return response;
    } catch (error) {
        console.error("Error in chatLangchainRAG:", error);
        throw error;
    }
}



export async function testingLangGraph(prompt: string) {
    // Define a simple search tool that returns an object instead of a string.
    const search = tool(
      async ({ query }: { query: string }) => {
        // Return an object with a "result" property.
        if (query.toLowerCase().includes("sf") || query.toLowerCase().includes("sf")) {
          return { result: "It's 60 degrees and foggy." };
        }
        return { result: "It's 90 degrees and sunny." };
      },
      {
        name: "search",
        description: "Call to surf the web.",
        schema: z.object({
          query: z.string().describe("The query to use in your search."),
        }),
      }
    );
  
    const tools = [search];
    const aiModelPath: string = getAIModelPath();
    const llamaPath: string = path.join(aiModelPath, "llama-3.2-3b-instruct.Q2_K.gguf");
    const model = await LlamaCpp.initialize({
      modelPath: llamaPath,
      threads: 8, // Adjust based on your hardware.
    });
  
    // Patch the model to add a bindTools method if not already defined.
    if (!(model as any).bindTools) {
      (model as any).bindTools = function (tools: any[]) {
        // Optionally store the tools if needed.
        return this;
      };
    }
  
    // Initialize memory to persist state between graph runs.
    const checkpointer = new MemorySaver();
  
    // Create the React agent using the patched model.
    const app = createReactAgent({
      llm: model,
      tools,
      checkpointSaver: checkpointer,
    });
  
    // Invoke the agent.
    const result = await app.invoke(
      {
        messages: [
          {
            role: "user",
            content: "what is the weather in sf",
          },
        ],
      },
      { configurable: { thread_id: 42 } }
    );
    console.log(result.messages.at(-1)?.content);
  }
