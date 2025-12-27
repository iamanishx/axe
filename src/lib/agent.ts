import { google } from "@ai-sdk/google";
import { ToolLoopAgent, stepCountIs } from "ai";
import { saveMessage } from "./db";
import { createMCPClient } from '@ai-sdk/mcp';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const systemprompt = `You are an AI-powered code editor assistant running in a TUI.
You have access to the file system through MCP (Model Context Protocol).
Always use the provided tools to read, write, list, search files when the user asks.
Be concise and helpful.`;

const model = google("gemini-2.5-flash");

export type AgentMessage = {
    role: "user" | "assistant";
    content: string;
};

export async function runAgent(prompt: string, history: AgentMessage[]) {
    try {
        
        const mcpClient = await createMCPClient({
            transport: new StdioClientTransport({
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
    
            })
        })

        const myAgent = new ToolLoopAgent({
            model: model,
            instructions: systemprompt,
            tools: await mcpClient.tools(),
            stopWhen: stepCountIs(10),
        });

        const messages: Array<{ role: "user" | "assistant"; content: string }> = [
            ...history.map((h) => ({ role: h.role, content: h.content })),
            { role: "user" as const, content: prompt },
        ];

        const result = await myAgent.generate({ messages });

        const text = result.text ?? "";

        saveMessage("user", prompt);
        saveMessage("assistant", text);

        return text;
    } catch (error: any) {
        console.error("Agent Error:", error);
        return `Error: ${error.message}`;
    }
}
