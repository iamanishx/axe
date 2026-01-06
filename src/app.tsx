import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useInput, Static } from "ink";
import { Header } from "./ui/header";
import { MessageComponent } from "./ui/message";
import { InputArea } from "./ui/input-area";
import { SessionPicker } from "./ui/session-picker";
import {
    getRecentMessages,
    getCurrentDirSessions,
    getOtherDirSessions,
    getSessionMessages,
    getSessionId,
    createNewSession,
    setSessionId,
    type Message,
    type Session,
} from "./lib/db";
import { runAgentStream } from "./lib/agent";
import { loadConfig, setProvider, type ProviderName } from "./lib/config";
import { PROVIDER_MODELS } from "./lib/provider";
import { triggerRerender } from "./index";

type View = "session_picker" | "chat" | "history" | "provider" | "model" | "agent";

type AppProps = {
    skipInitialLoad?: boolean;
};

export const App = ({ skipInitialLoad = false }: AppProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [streamingContent, setStreamingContent] = useState("");
    const [thinking, setThinking] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<View>("session_picker");
    const [currentDirSessions, setCurrentDirSessions] = useState<Session[]>([]);
    const [otherDirSessions, setOtherDirSessions] = useState<Session[]>([]);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [config, setConfig] = useState(loadConfig());
    const [agentType, setAgentType] = useState<"tool-loop" | "ralph-loop">("tool-loop");

    useEffect(() => {
        if (skipInitialLoad) {
            setView("chat");
            return;
        }

        const sessions = getCurrentDirSessions();
        setCurrentDirSessions(sessions);

        if (sessions.length === 0) {
            createNewSession();
            setView("chat");
        } else {
            setView("session_picker");
        }
    }, [skipInitialLoad]);

    const providers = Object.keys(PROVIDER_MODELS) as ProviderName[];
    const currentModels = PROVIDER_MODELS[config.provider] || [];

    const handleSessionSelect = (session: Session | null) => {
        if (session === null) {
            createNewSession();
            setMessages([]);
        } else {
            setSessionId(session.id);
            const msgs = getSessionMessages(session.id, 100);
            setMessages(msgs);
        }
        setView("chat");
    };

    const handleSessionNavigate = (direction: "up" | "down") => {
        const totalItems = currentDirSessions.length + 1;
        if (direction === "up") {
            setSelectedIdx((p) => Math.max(0, p - 1));
        } else {
            setSelectedIdx((p) => Math.min(totalItems - 1, p + 1));
        }
    };

    useInput((input, key) => {
        if (view === "history") {
            if (key.escape || input === "q") {
                setView("chat");
                return;
            }
            const allSessions = [...currentDirSessions, ...otherDirSessions];
            if (key.upArrow) setSelectedIdx((p) => Math.max(0, p - 1));
            if (key.downArrow) setSelectedIdx((p) => Math.min(allSessions.length - 1, p + 1));
            if (key.return && allSessions[selectedIdx]) {
                const session = allSessions[selectedIdx];
                const msgs = getSessionMessages(session.id, 1000);
                setMessages(msgs);
                setView("chat");
            }
            return;
        }

        if (view === "provider") {
            if (key.escape || input === "q") {
                setView("chat");
                return;
            }
            if (key.upArrow) setSelectedIdx((p) => Math.max(0, p - 1));
            if (key.downArrow) setSelectedIdx((p) => Math.min(providers.length - 1, p + 1));
            if (key.return) {
                const newProvider = providers[selectedIdx];
                const defaultModel = PROVIDER_MODELS[newProvider][0];
                setProvider(newProvider, defaultModel);
                setConfig(loadConfig());
                setView("chat");
            }
            return;
        }

        if (view === "model") {
            if (key.escape || input === "q") {
                setView("chat");
                return;
            }
            if (key.upArrow) setSelectedIdx((p) => Math.max(0, p - 1));
            if (key.downArrow) setSelectedIdx((p) => Math.min(currentModels.length - 1, p + 1));
            if (key.return) {
                const newModel = currentModels[selectedIdx];
                setProvider(config.provider, newModel);
                setConfig(loadConfig());
                setView("chat");
            }
            return;
        }
    }, { isActive: view !== "chat" && view !== "session_picker" });

    useInput((input, key) => {
        if (view === "agent") {
            if (key.escape || input === "q") {
                setView("chat");
                return;
            }
            if (key.upArrow) setSelectedIdx((p) => Math.max(0, p - 1));
            if (key.downArrow) setSelectedIdx((p) => Math.min(agentTypes.length - 1, p + 1));
            if (key.return) {
                const newAgentType = agentTypes[selectedIdx] as "tool-loop" | "ralph-loop";
                setAgentType(newAgentType);
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    session_id: getSessionId(),
                    role: "assistant",
                    content: `Switched agent to ${newAgentType === "tool-loop" ? "Tool Loop" : "Ralph Loop"}`,
                    created_at: new Date().toISOString(),
                }]);
                setView("chat");
            }
            return;
        }
    }, { isActive: view === "agent" });

    const agentTypes = ["tool-loop", "ralph-loop"];

    const handleInput = useCallback(async (input: string) => {
        const cmd = input.toLowerCase().trim();

        if (cmd === "/history") {
            setCurrentDirSessions(getCurrentDirSessions());
            setOtherDirSessions(getOtherDirSessions());
            setSelectedIdx(0);
            setView("history");
            return;
        }

        if (cmd === "/provider") {
            setSelectedIdx(providers.indexOf(config.provider));
            setView("provider");
            return;
        }

        if (cmd === "/model") {
            setSelectedIdx(currentModels.indexOf(config.model));
            setView("model");
            return;
        }

        if (cmd === "/agent") {
            setSelectedIdx(agentTypes.indexOf(agentType));
            setView("agent");
            return;
        }

        if (cmd === "/clear" || cmd === "/new") {
            if (cmd === "/new") {
                createNewSession();
            }
            triggerRerender();
            return;
        }

        setIsLoading(true);
        setError(null);

        const currentSessionId = getSessionId();

        const userMsg: Message = {
            id: Date.now(),
            session_id: currentSessionId,
            role: "user",
            content: input,
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => {
            const newHistory = [...prev, userMsg];

            (async () => {
                try {
                    const agentHistory = newHistory.slice(-50).map((m) => ({
                        role: m.role as "user" | "assistant",
                        content: m.content,
                    }));

                    const fileRefs = input.match(/@([a-zA-Z0-9_./-]+)/g);
                    let finalInput = input;

                    if (fileRefs && fileRefs.length > 0) {
                        const files = fileRefs.map(ref => ref.substring(1)).join(", ");
                        finalInput = `${input}\n\n[System Note: The user referenced the following files: ${files}. Please read them if necessary to answer the query.]`;
                    }

                    const stream = runAgentStream(finalInput, agentHistory, agentType);

                    let accumulatedContent = "";

                    for await (const event of stream) {
                        if (event.type === "text") {
                            accumulatedContent += event.content;
                            setStreamingContent(accumulatedContent);
                        } else if (event.type === "thinking") {
                            setThinking(event.content);
                        }
                    }

                    const aiMsg: Message = {
                        id: Date.now() + 1,
                        session_id: currentSessionId,
                        role: "assistant",
                        content: accumulatedContent,
                        created_at: new Date().toISOString(),
                    };

                    setMessages((p) => [...p, aiMsg]);
                } catch (e: any) {
                    setError(e.message);
                } finally {
                    setIsLoading(false);
                    setStreamingContent("");
                    setThinking(null);
                }
            })();

            return newHistory;
        });
    }, [providers, config.provider, currentModels, config.model, agentType]);

    if (view === "session_picker") {
        return (
            <SessionPicker
                currentDirSessions={currentDirSessions}
                selectedIndex={selectedIdx}
                onSelect={handleSessionSelect}
                onNavigate={handleSessionNavigate}
            />
        );
    }

    if (view === "provider") {
        return (
            <Box flexDirection="column" paddingX={2} paddingY={1}>
                <Text color="cyan" bold>⚙️  Select Provider</Text>
                <Text dimColor>━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
                <Box flexDirection="column" marginY={1}>
                    {providers.map((p, i) => (
                        <Text key={p} color={i === selectedIdx ? "green" : "white"} bold={i === selectedIdx}>
                            {i === selectedIdx ? "▸ " : "  "}{p} {p === config.provider ? <Text dimColor>(current)</Text> : ""}
                        </Text>
                    ))}
                </Box>
                <Text dimColor>━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
                <Text dimColor><Text color="gray">↑↓</Text> Navigate  <Text color="gray">Enter</Text> Select  <Text color="gray">q</Text> Back</Text>
            </Box>
        );
    }

    if (view === "model") {
        return (
            <Box flexDirection="column" paddingX={2} paddingY={1}>
                <Text color="cyan" bold>🤖 Select Model <Text dimColor>({config.provider})</Text></Text>
                <Text dimColor>━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
                <Box flexDirection="column" marginY={1}>
                    {currentModels.map((m, i) => (
                        <Text key={m} color={i === selectedIdx ? "green" : "white"} bold={i === selectedIdx}>
                            {i === selectedIdx ? "▸ " : "  "}{m} {m === config.model ? <Text dimColor>(current)</Text> : ""}
                        </Text>
                    ))}
                </Box>
                <Text dimColor>━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
                <Text dimColor><Text color="gray">↑↓</Text> Navigate  <Text color="gray">Enter</Text> Select  <Text color="gray">q</Text> Back</Text>
            </Box>
        );
    }

    if (view === "agent") {
        return (
            <Box flexDirection="column" paddingX={2} paddingY={1}>
                <Text color="cyan" bold>🕵️ Select Agent</Text>
                <Text dimColor>━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
                <Box flexDirection="column" marginY={1}>
                    {agentTypes.map((t, i) => (
                        <Text key={t} color={i === selectedIdx ? "green" : "white"} bold={i === selectedIdx}>
                            {i === selectedIdx ? "▸ " : "  "}{t === "tool-loop" ? "Tool Loop (Standard)" : "Ralph Loop (Continuous)"} {t === agentType ? <Text dimColor>(current)</Text> : ""}
                        </Text>
                    ))}
                </Box>
                <Text dimColor>━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
                <Text dimColor><Text color="gray">↑↓</Text> Navigate  <Text color="gray">Enter</Text> Select  <Text color="gray">q</Text> Back</Text>
            </Box>
        );
    }

    if (view === "history") {
        const allSessions = [...currentDirSessions, ...otherDirSessions];
        return (
            <Box flexDirection="column" paddingX={2} paddingY={1}>
                <Text color="cyan" bold>📚 Session History</Text>
                <Text dimColor>━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>

                <Box flexDirection="column" marginY={1}>
                    <Text bold color="yellow">📂 Current Directory</Text>
                    {currentDirSessions.length === 0 ? (
                        <Text dimColor>  No sessions</Text>
                    ) : (
                        currentDirSessions.map((s, i) => (
                            <Text key={s.id} color={i === selectedIdx ? "green" : "white"} bold={i === selectedIdx}>
                                {i === selectedIdx ? "▸ " : "  "}💬 {s.name || "Session"} <Text dimColor>({s.message_count} msgs)</Text>
                            </Text>
                        ))
                    )}
                </Box>

                {otherDirSessions.length > 0 && (
                    <Box flexDirection="column" marginY={1}>
                        <Text bold color="blue">📁 Other Directories</Text>
                        {otherDirSessions.map((s, i) => {
                            const idx = currentDirSessions.length + i;
                            return (
                                <Text key={s.id} color={idx === selectedIdx ? "green" : "white"} bold={idx === selectedIdx}>
                                    {idx === selectedIdx ? "▸ " : "  "}📍 {s.path} <Text dimColor>({s.message_count} msgs)</Text>
                                </Text>
                            );
                        })}
                    </Box>
                )}

                <Text dimColor>━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
                <Text dimColor><Text color="gray">↑↓</Text> Navigate  <Text color="gray">Enter</Text> Load  <Text color="gray">q</Text> Back</Text>
            </Box>
        );
    }

    return (
        <Box flexDirection="column">
            <Header provider={config.provider} model={config.model} />

            <Static items={messages}>
                {(msg) => (
                    <Box key={msg.id} paddingX={1}>
                        <MessageComponent
                            role={msg.role}
                            content={msg.content}
                        />
                    </Box>
                )}
            </Static>

            {isLoading && (
                <Box paddingX={1}>
                    <MessageComponent
                        role="assistant"
                        content={streamingContent}
                        thinking={thinking || undefined}
                    />
                </Box>
            )}

            <Box flexDirection="column" paddingX={1}>
                {error && <Text color="red">❌ Error: {error}</Text>}
                <InputArea onSubmit={handleInput} isLoading={isLoading} />
            </Box>
        </Box>
    );
};