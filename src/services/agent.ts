import { DynamicTool } from "langchain/tools";
import { createOpenAIFunctionsAgent, AgentExecutor } from "langchain/agents";
import { ChatOllama } from "@langchain/ollama";
import { searchRelevantChunks } from "./vectorStore.js";
import { fileManagerService } from "./fileManager.js";
import { ollamaLLMService } from "./ollamaLLM.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// Define tools
const searchCodebaseTool = new DynamicTool({
  name: "search_codebase",
  description: "Retrieve relevant code snippets/files for a query",
  func: async (query: string) => {
    const chunks = await searchRelevantChunks(query, 5);
    return chunks.map(c => `// File: ${c.filePath}\n${c.content}`).join("\n\n");
  }
});

const readFileTool = new DynamicTool({
  name: "read_file",
  description: "Read the contents of a file",
  func: async (filePath: string) => {
    return await fileManagerService.readFile(filePath);
  }
});

const writeFileTool = new DynamicTool({
  name: "write_file",
  description: "Write content to a file",
  func: async (input: string) => {
    const { filePath, content } = JSON.parse(input);
    await fileManagerService.writeFile(filePath, content);
    return "File written";
  }
});

const codeLLMTool = new DynamicTool({
  name: "generate_code",
  description: "Generate code changes from feedback and context",
  func: async (feedback: string) => {
    const result = await ollamaLLMService.generateCodeChanges(feedback);
    return JSON.stringify(result);
  }
});

const tools = [searchCodebaseTool, readFileTool, writeFileTool, codeLLMTool];

export async function runMultiStepAgent(userQuery: string): Promise<any> {
  const prompt = ChatPromptTemplate.fromPromptMessages([
    ["system", "You are a coding agent that can search and modify code files intelligently based on user queries. Use the tools provided to answer complex requests like adding components, editing styles, or finding relevant code. Think step by step."],
    ["user", "{input}"]
  ]);

  const agent = await createOpenAIFunctionsAgent({
    llm: new ChatOllama({
      baseUrl: "http://localhost:11434",
      model: "qwen2.5-coder:7b"
    }),
    tools,
    prompt
  });

  const executor = new AgentExecutor({ agent, tools, verbose: true });
  const result = await executor.invoke({ input: userQuery });
  return result;
}
