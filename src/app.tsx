import React, { useState, useEffect, useCallback } from "react";
import { useKeyboard } from "@opentui/react";
import { Header } from "./ui/header";
import { MessageComponent } from "./ui/message";
import { InputArea } from "./ui/input-area";
import { SessionPicker } from "./ui/session-picker";
import { ConfirmationDialog } from "./ui/confirmation-dialog";
import { Layout } from "./ui/layout";
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
    const [confirmationRequest, setConfirmationRequest] = useState<{
        toolName: string;
        args: any;
        resolve: (allowed: boolean) => void;
    } | null>(null);

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

    useEffect(() => {
        if (view === "chat") {
            setMessages(getSessionMessages(getSessionId()));
        }
    }, [view]);

    useEffect(() => {
        if (view === "history") {
            setCurrentDirSessions(getCurrentDirSessions());
            setOtherDirSessions(getOtherDirSessions());
            setSelectedIdx(0);
        }
    }, [view]);

    const handleSessionSelect = (session: Session | null) => {
        if (session) {
            setSessionId(session.id);
        } else {
            createNewSession();
        }
        setView("chat");
    };

    const handleSessionNavigate = (direction: "up" | "down") => {
        setCurrentDirSessions((current) => {
            const maxIdx = current.length;
            if (direction === "up") {
                setSelectedIdx((prev) => Math.max(0, prev - 1));
            } else {
                setSelectedIdx((prev) => Math.min(maxIdx, prev + 1));
            }
            return current;
        });
    };

    const providers = Object.keys(PROVIDER_MODELS) as ProviderName[];
    const currentModels = PROVIDER_MODELS[config.provider] || [];

    useKeyboard((key) => {
        if (view === "history") {
            if (key.name === "escape" || key.sequence === "q") {
                setView("chat");
                return;
            }
            const allSessions = [...currentDirSessions, ...otherDirSessions];
            if (key.name === "up") setSelectedIdx((p) => Math.max(0, p - 1));
            if (key.name === "down") setSelectedIdx((p) => Math.min(allSessions.length - 1, p + 1));
            if (key.name === "return" || key.name === "enter") {
                if (allSessions[selectedIdx]) {
                    setSessionId(allSessions[selectedIdx].id);
                    setView("chat");
                }
            }
            return;
        }

        if (view === "provider") {
            if (key.name === "escape" || key.sequence === "q") {
                setView("chat");
                return;
            }
            if (key.name === "up") setSelectedIdx((p) => Math.max(0, p - 1));
            if (key.name === "down") setSelectedIdx((p) => Math.min(providers.length - 1, p + 1));
            if (key.name === "return" || key.name === "enter") {
                const newProvider = providers[selectedIdx];
                const defaultModel = PROVIDER_MODELS[newProvider][0];
                setProvider(newProvider, defaultModel);
                setConfig(loadConfig());
                setView("chat");
            }
            return;
        }

        if (view === "model") {
            if (key.name === "escape" || key.sequence === "q") {
                setView("chat");
                return;
            }
            if (key.name === "up") setSelectedIdx((p) => Math.max(0, p - 1));
            if (key.name === "down") setSelectedIdx((p) => Math.min(currentModels.length - 1, p + 1));
            if (key.name === "return" || key.name === "enter") {
                const newModel = currentModels[selectedIdx];
                setProvider(config.provider, newModel);
                setConfig(loadConfig());
                setView("chat");
            }
            return;
        }
    });

    const handleInput = useCallback(async (input: string) => {
        if (input.startsWith("/")) {
            const cmd = input.slice(1).trim().toLowerCase();
            if (cmd === "new") {
                createNewSession();
                setMessages([]);
                return;
            }
            if (cmd === "clear") {
                setMessages([]);
                setStreamingContent("");
                setThinking(null);
                setError(null);
                return;
            }
            if (cmd === "history") {
                setView("history");
                return;
            }
            if (cmd === "provider") {
                setView("provider");
                return;
            }
            if (cmd === "model") {
                setView("model");
                return;
            }
        }

        const currentSessionId = getSessionId();
        const userMsg: Message = {
            id: Date.now(),
            session_id: currentSessionId,
            role: "user",
            content: input,
            created_at: new Date().toISOString(),
        };

        setMessages((p) => [...p, userMsg]);
        setIsLoading(true);
        setError(null);

        try {
            const newHistory = [...messages, userMsg];

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

                    const onConfirmation = (toolName: string, args: any) => {
                        return new Promise<boolean>((resolve) => {
                            setConfirmationRequest({ toolName, args, resolve });
                        });
                    };

                    const stream = runAgentStream(finalInput, agentHistory, onConfirmation);

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
        } catch (_error) {
            // Errors are handled inside the async IIFE above
        }

    }, [config.provider, config.model, messages]);

    // Renders
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
            <box flexDirection="column" paddingLeft={2} paddingRight={2} paddingBottom={1} paddingTop={1}>
                <text fg="cyan"><strong>⚙️  Select Provider</strong></text>
                <text fg="#666666">━━━━━━━━━━━━━━━━━━━━━━━━━━━━</text>
                <box flexDirection="column" marginY={1}>
                    {providers.map((p, i) => (
                        <text key={p}>
                            <span fg={i === selectedIdx ? "green" : "white"}><strong>{i === selectedIdx ? "▸ " : "  "}</strong></span>
                            <span fg={i === selectedIdx ? "green" : "white"}>{p}</span>
                            {p === config.provider ? <span fg="#666666"> (current)</span> : ""}
                        </text>
                    ))}
                </box>
                <text fg="#666666">━━━━━━━━━━━━━━━━━━━━━━━━━━━━</text>
                <text fg="#666666"><span fg="gray">↑↓</span> Navigate  <span fg="gray">Enter</span> Select  <span fg="gray">q</span> Back</text>
            </box>
        );
    }

    if (view === "model") {
        return (
            <box flexDirection="column" paddingLeft={2} paddingRight={2} paddingBottom={1} paddingTop={1}>
                <text fg="cyan"><strong>🤖 Select Model <span fg="#666666">({config.provider})</span></strong></text>
                <text fg="#666666">━━━━━━━━━━━━━━━━━━━━━━━━━━━━</text>
                <box flexDirection="column" marginY={1}>
                    {currentModels.map((m, i) => (
                        <text key={m}>
                            <span fg={i === selectedIdx ? "green" : "white"}><strong>{i === selectedIdx ? "▸ " : "  "}</strong></span>
                            <span fg={i === selectedIdx ? "green" : "white"}>{m}</span>
                            {m === config.model ? <span fg="#666666"> (current)</span> : ""}
                        </text>
                    ))}
                </box>
                <text fg="#666666">━━━━━━━━━━━━━━━━━━━━━━━━━━━━</text>
                <text fg="#666666"><span fg="gray">↑↓</span> Navigate  <span fg="gray">Enter</span> Select  <span fg="gray">q</span> Back</text>
            </box>
        );
    }

    if (view === "history") {
        return (
            <box flexDirection="column" paddingLeft={2} paddingRight={2} paddingBottom={1} paddingTop={1}>
                <text fg="cyan"><strong>📚 Session History</strong></text>
                <text fg="#666666">━━━━━━━━━━━━━━━━━━━━━━━━━━━━</text>

                <box flexDirection="column" marginY={1}>
                    <text fg="yellow"><strong>📂 Current Directory</strong></text>
                    {currentDirSessions.length === 0 ? (
                        <text fg="#666666">  No sessions</text>
                    ) : (
                        currentDirSessions.map((s, i) => (
                            <text key={s.id}>
                                <span fg={i === selectedIdx ? "green" : "white"}><strong>{i === selectedIdx ? "▸ " : "  "}</strong></span>
                                <span fg={i === selectedIdx ? "green" : "white"}>💬 {s.name || "Session"}</span>
                                <span fg="#666666"> ({String(s.message_count)} msgs)</span>
                            </text>
                        ))
                    )}
                </box>

                {otherDirSessions.length > 0 && (
                    <box flexDirection="column" marginY={1}>
                        <text fg="blue"><strong>📁 Other Directories</strong></text>
                        {otherDirSessions.map((s, i) => {
                            const idx = currentDirSessions.length + i;
                            return (
                                <text key={s.id}>
                                    <span fg={idx === selectedIdx ? "green" : "white"}><strong>{idx === selectedIdx ? "▸ " : "  "}</strong></span>
                                    <span fg={idx === selectedIdx ? "green" : "white"}>📍 {s.path}</span>
                                    <span fg="#666666"> ({String(s.message_count)} msgs)</span>
                                </text>
                            );
                        })}
                    </box>
                )}

                <text fg="#666666">━━━━━━━━━━━━━━━━━━━━━━━━━━━━</text>
                <text fg="#666666"><span fg="gray">↑↓</span> Navigate  <span fg="gray">Enter</span> Load  <span fg="gray">q</span> Back</text>
            </box>
        );
    }

    return (
        <box flexDirection="column">
            {confirmationRequest ? (
                <ConfirmationDialog
                    toolName={confirmationRequest.toolName}
                    args={confirmationRequest.args}
                    onConfirm={() => {
                        confirmationRequest.resolve(true);
                        setConfirmationRequest(null);
                    }}
                    onDeny={() => {
                        confirmationRequest.resolve(false);
                        setConfirmationRequest(null);
                    }}
                />
            ) : null}

            {!confirmationRequest && (
                <Layout
                    header={<Header provider={config.provider} model={config.model} />}
                    footer={
                        <box flexDirection="column">
                            {error && <text fg="red">Error: {error}</text>}
                            <InputArea onSubmit={handleInput} isLoading={isLoading} />
                        </box>
                    }
                >
                    {messages.map((msg) => (
                        <box key={msg.id} marginBottom={1}>
                            <MessageComponent
                                role={msg.role}
                                content={msg.content}
                            />
                        </box>
                    ))}

                    {isLoading && (
                        <box marginBottom={1}>
                            <MessageComponent
                                role="assistant"
                                content={streamingContent}
                                thinking={thinking || undefined}
                            />
                        </box>
                    )}
                </Layout>
            )}
        </box>
    );
};
