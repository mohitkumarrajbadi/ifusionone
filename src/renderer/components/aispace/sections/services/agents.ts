// // services/agent.ts

// import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
// import { ChatOpenAI } from "@langchain/openai";
// import { HumanMessage, AIMessage } from "@langchain/core/messages";
// import { ToolNode } from "@langchain/langgraph/prebuilt";
// import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";

// // ✅ Initialize the tools for the agent
// const tools = [
//   new TavilySearchResults({
//     maxResults: 3,
//     apiKey: process.env.REACT_APP_TAVILY_API_KEY,
//   }),
// ];

// const toolNode = new ToolNode(tools);

// // ✅ Configure the OpenAI model with tool support
// const model = new ChatOpenAI({
//   model: "gpt-4o-mini",       // Use GPT-4o or any other model
//   temperature: 0.7,
//   openAIApiKey: process.env.REACT_APP_OPENAI_API_KEY,
// }).bindTools(tools);

// // ✅ Define whether to continue or stop based on tool calls
// function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
//   const lastMessage = messages[messages.length - 1] as AIMessage;

//   if (lastMessage.tool_calls?.length) {
//     return "tools";
//   }
//   return "__end__";
// }

// // ✅ Define the function that calls the model
// async function callModel(state: typeof MessagesAnnotation.State) {
//   const response = await model.invoke(state.messages);
//   return { messages: [response] };
// }

// // ✅ Build the state graph
// const workflow = new StateGraph(MessagesAnnotation)
//   .addNode("agent", callModel)
//   .addEdge("__start__", "agent")
//   .addNode("tools", toolNode)
//   .addEdge("tools", "agent")
//   .addConditionalEdges("agent", shouldContinue);

// const app = workflow.compile();

// export async function runAgent(message: string, prevMessages: any[] = []) {
//   const state = await app.invoke({
//     messages: [...prevMessages, new HumanMessage(message)],
//   });

//   return state.messages[state.messages.length - 1].content;
// }
