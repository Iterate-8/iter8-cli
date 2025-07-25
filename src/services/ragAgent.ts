import { searchRelevantChunks } from "./vectorStore.js";
import { fileManagerService } from "./fileManager.js";
import { huggingfaceLLMService } from "./huggingfaceLLM.js";
import { logInfo, logError } from "../utils/logger.js";

/**
 * Multi-step agent that combines RAG with HuggingFace LLM
 * Optimized for Mac performance using smaller models
 */
export async function runMultiStepAgent(userQuery: string): Promise<any> {
  try {
    logInfo(`Starting multi-step agent for query: "${userQuery}"`);
    
    // Step 1: Search relevant code chunks
    const relevantChunks = await searchRelevantChunks(userQuery, 5);
    logInfo(`Found ${relevantChunks.length} relevant code chunks`);
    
    // Step 2: Build context from code chunks
    let context = '';
    if (relevantChunks.length > 0) {
      context = 'RELEVANT CODE CONTEXT:\n\n';
      relevantChunks.forEach((chunk, index) => {
        context += `File ${index + 1}: ${chunk.filePath}\n`;
        context += `${chunk.content}\n\n`;
      });
    }
    
    // Step 3: Create enhanced prompt with context
    const enhancedQuery = context 
      ? `${context}USER REQUEST: ${userQuery}\n\nPlease generate code changes that work with the existing codebase above.`
      : userQuery;
    
    // Step 4: Generate code using HuggingFace
    const result = await huggingfaceLLMService.generateCodeChanges(enhancedQuery);
    
    logInfo(`Generated ${result.changes?.length || 0} code changes`);
    
    return result;
  } catch (error) {
    logError(`Multi-step agent failed: ${error}`);
    throw error;
  }
}

/**
 * Simple agent that uses HuggingFace directly without RAG
 * Useful for general coding tasks that don't need existing code context
 */
export async function runSimpleAgent(userQuery: string): Promise<any> {
  try {
    logInfo(`Running simple agent for query: "${userQuery}"`);
    
    const result = await huggingfaceLLMService.generateCodeChanges(userQuery);
    
    logInfo(`Generated ${result.changes?.length || 0} code changes`);
    
    return result;
  } catch (error) {
    logError(`Simple agent failed: ${error}`);
    throw error;
  }
}

/**
 * Tool-based agent that can perform file operations
 * Uses a more structured approach with predefined tools
 */
export class ToolAgent {
  private tools = {
    readFile: async (filePath: string) => {
      try {
        return await fileManagerService.readFile(filePath);
      } catch (error) {
        return `Error reading file: ${error}`;
      }
    },
    
    writeFile: async (filePath: string, content: string) => {
      try {
        await fileManagerService.writeFile(filePath, content);
        return `Successfully wrote to ${filePath}`;
      } catch (error) {
        return `Error writing file: ${error}`;
      }
    },
    
    searchCode: async (query: string) => {
      try {
        const chunks = await searchRelevantChunks(query, 3);
        return chunks.map(c => `${c.filePath}:\n${c.content}`).join('\n\n');
      } catch (error) {
        return `Error searching code: ${error}`;
      }
    }
  };

  async execute(userQuery: string): Promise<any> {
    try {
      logInfo(`Tool agent executing: "${userQuery}"`);
      
      // Analyze the query to determine which tools might be needed
      const toolsNeeded = this.analyzeQueryForTools(userQuery);
      
      // Build context by using relevant tools
      let context = '';
      for (const tool of toolsNeeded) {
        if (tool === 'searchCode') {
          const searchResult = await this.tools.searchCode(userQuery);
          context += `EXISTING CODE:\n${searchResult}\n\n`;
        }
      }
      
      // Generate code with tool context
      const enhancedQuery = context 
        ? `${context}USER REQUEST: ${userQuery}\n\nGenerate code that works with the existing code shown above.`
        : userQuery;
      
      const result = await huggingfaceLLMService.generateCodeChanges(enhancedQuery);
      
      logInfo(`Tool agent generated ${result.changes?.length || 0} changes`);
      
      return result;
    } catch (error) {
      logError(`Tool agent failed: ${error}`);
      throw error;
    }
  }
  
  private analyzeQueryForTools(query: string): string[] {
    const tools: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Determine if we need to search existing code
    if (lowerQuery.includes('modify') || lowerQuery.includes('update') || 
        lowerQuery.includes('change') || lowerQuery.includes('improve') ||
        lowerQuery.includes('extend') || lowerQuery.includes('refactor')) {
      tools.push('searchCode');
    }
    
    return tools;
  }
}

export const toolAgent = new ToolAgent();