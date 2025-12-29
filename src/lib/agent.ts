import { ToolLoopAgent, stepCountIs } from "ai";
import { saveMessage } from "./db.js";
import { createMCPClient } from "@ai-sdk/mcp";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { shellTool } from "../tools/shell.js";
import { getModel } from "./provider.js";
import { loadConfig } from "./config.js";

const systemprompt = `You are an AI-powered code editor assistant running in a TUI.
You have access to:
- File system (read, write, list, search files via MCP)
- Shell commands (run terminal commands)
- Web search (search DuckDuckGo for docs, references, solutions)
- Fetch content (grab webpage content for context)

Always use tools when needed. Be concise and helpful.`;

export type AgentMessage = {
    role: "user" | "assistant";
    content: string;
};

export async function runAgent(prompt: string, history: AgentMessage[]) {
    try {
        const config = loadConfig();
        const model = getModel(config.provider, config.model);

        const fsClient = await createMCPClient({
            transport: new StdioClientTransport({
                command: "npx",
                args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
            }),
        });

        const searchClient = await createMCPClient({
            transport: new StdioClientTransport({
                command: "uvx",
                args: ["duckduckgo-mcp-server"],
            }),
        });

        const fsTools = await fsClient.tools();
        const searchTools = await searchClient.tools();

        const myAgent = new ToolLoopAgent({
            model: model,
            instructions: systemprompt,
            tools: {
                ...fsTools,
                ...searchTools,
                shell: shellTool,
            },
            stopWhen: stepCountIs(100),
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
