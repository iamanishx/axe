import { saveMessage } from "./db.js";
import { createMCPClient } from "@ai-sdk/mcp";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { shellTool } from "../tools/shell.js";
import { getModel } from "./provider.js";
import { loadConfig, getAutoAllowedTools } from "./config.js";
import { systemprompt } from "./prompt.js";
import { createLLMStream } from "./llm.js";
import type { ToolSet, Tool } from "ai";

export type AgentMessage = {
    role: "user" | "assistant";
    content: string;
};

export type StreamEvent =
    | { type: "text"; content: string }
    | { type: "thinking"; content: string };

type ConfirmationCallback = (toolName: string, args: any) => Promise<boolean>;

function wrapToolsWithHIL(
    tools: ToolSet,
    autoAllowed: string[],
    onConfirmation?: ConfirmationCallback
): ToolSet {
    const wrapped: ToolSet = {};

    for (const [name, t] of Object.entries(tools)) {
        const original = t as Tool;
        if (!original.execute) {
            wrapped[name] = original;
            continue;
        }

        const originalExecute = original.execute;
        wrapped[name] = {
            ...original,
            execute: async (args: any, options: any) => {
                if (!autoAllowed.includes(name) && onConfirmation) {
                    const allowed = await onConfirmation(name, args);
                    if (!allowed) {
                        return "Tool execution denied by user.";
                    }
                }
                return originalExecute(args, options);
            },
        };
    }

    return wrapped;
}

export async function* runAgentStream(
    prompt: string,
    history: AgentMessage[],
    onConfirmation?: ConfirmationCallback
): AsyncGenerator<StreamEvent> {
    let fsClient: any = null;
    let searchClient: any = null;

    try {
        const config = loadConfig();
        const model = getModel(config.provider, config.model);
        const exaUrl = new URL("https://mcp.exa.ai/mcp");
        const exaApiKey = config.keys.exa || process.env.EXA_API_KEY;

        if (exaApiKey) {
            exaUrl.searchParams.set("exaApiKey", exaApiKey);
        }

        fsClient = await createMCPClient({
            transport: new StdioClientTransport({
                command: "npx",
                args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
                stderr: "ignore",
            }),
        });

        searchClient = await createMCPClient({
            transport: new StreamableHTTPClientTransport(exaUrl),
        });

        const fsTools = await fsClient.tools();
        const searchTools = await searchClient.tools();

        const rawTools: ToolSet = {
            ...fsTools,
            ...searchTools,
            shell: shellTool,
        };

        const autoAllowed = getAutoAllowedTools();
        const tools = wrapToolsWithHIL(rawTools, autoAllowed, onConfirmation);

        const messages: Array<{ role: "user" | "assistant"; content: string }> = [
            ...history.map((h) => ({ role: h.role, content: h.content })),
            { role: "user", content: prompt },
        ];

        const result = createLLMStream({
            model,
            system: systemprompt,
            messages,
            tools,
        });

        let fullText = "";

        for await (const part of result.fullStream) {
            switch (part.type) {
                case "text-delta":
                    fullText += part.text;
                    yield { type: "text", content: part.text };
                    break;

                case "tool-call":
                    yield { type: "thinking", content: `Using tool: ${part.toolName}` };
                    break;

                case "tool-result":
                    yield { type: "thinking", content: `Tool complete: ${part.toolName}` };
                    break;

                case "error":
                    yield { type: "text", content: `\nError: ${part.error}` };
                    break;

                default:
                    break;
            }
        }

        saveMessage("user", prompt);
        saveMessage("assistant", fullText);
    } catch (error: any) {
        if (
            error.name === "AbortError" ||
            error.message?.includes("CancelledError") ||
            error.message?.includes("KeyboardInterrupt") ||
            error.code === "ABORT_ERR"
        ) {
            return;
        }

        if (error.message?.includes("denied by user")) {
            yield { type: "text", content: "\n⚠️ Tool execution was denied." };
            return;
        }

        yield { type: "text", content: `Error: ${error.message}` };
    } finally {
        try {
            if (fsClient) await fsClient.close?.();
        } catch { }
        try {
            if (searchClient) await searchClient.close?.();
        } catch { }
    }
}
