import React, { useEffect } from "react";
import { ChatOpenAI } from "@langchain/openai";

const AiAgentManager = () => {
  // Use Vite’s environment variables via import.meta.env
  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
    openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
  });

  const invokeLLM = async () => {
    try {
      const response = await llm.invoke([{ role: "user", content: "Hi I'm Bob" }]);
      console.log("LLM Response:", response);
    } catch (error) {
      console.error("Error invoking LLM:", error);
    }
  };

  useEffect(() => {
    invokeLLM();
  }, []);

  return <div>AiAgentManager</div>;
};

export default AiAgentManager;
