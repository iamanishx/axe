import { ToolLoopAgent, stepCountIs } from "ai";
import { saveMessage } from "./db.js";
import { createMCPClient } from "@ai-sdk/mcp";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { shellTool } from "../tools/shell.js";
import { getModel } from "./provider.js";
import { loadConfig } from "./config.js";
import { systemprompt } from "./prompt.js";

export type AgentMessage = {
    role: "user" | "assistant";
    content: string;
};

export type StreamEvent =
    | { type: "text"; content: string }
    | { type: "thinking"; content: string };

export async function* runAgentStream(prompt: string, history: AgentMessage[]): AsyncGenerator<StreamEvent> {
    let fsClient: any = null;
    let searchClient: any = null;

    try {
        const config = loadConfig();
        const model = getModel(config.provider, config.model);

        fsClient = await createMCPClient({
            transport: new StdioClientTransport({
                command: "npx",
                args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
            }),
        });

        searchClient = await createMCPClient({
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

        const result = await myAgent.stream({ messages });

        saveMessage("user", prompt);
        let fullText = "";

        for await (const part of result.fullStream) {
            if (part.type === "text-delta") {
                const content = part.text;
                fullText += content;
                yield { type: "text", content };
            } else if (part.type === "tool-call") {
                yield { type: "thinking", content: `Using tool: ${part.toolName}` };
            }
        }

        saveMessage("assistant", fullText);
    } catch (error: any) {
        if (error.name === 'AbortError' || 
            error.message?.includes('CancelledError') ||
            error.message?.includes('KeyboardInterrupt') ||
            error.code === 'ABORT_ERR') {
            return;
        }
        
        yield { type: "text", content: `Error: ${error.message}` };
    } finally {
        try {
            if (fsClient) await fsClient.close?.();
        } catch {}
        try {
            if (searchClient) await searchClient.close?.();
        } catch {}
    }
}
