import React, { useState, useEffect, useCallback, useRef } from "react";
import { useKeyboard } from "@opentui/react";
import { Header } from "./ui/header";
import { MessageComponent } from "./ui/message";
import { InputArea } from "./ui/input-area";
import { ConfirmationDialog } from "./ui/confirmation-dialog";
import { Layout } from "./ui/layout";
import { loadConfig } from "./lib/config";
import { AcpClient } from "./lib/acp";
import { SessionPicker, type ACPSession } from "./ui/session-picker";

type Message = {
    id: number;
    role: "user" | "assistant" | "system";
    content: string;
};

type AppProps = {
    skipInitialLoad?: boolean;
};

export const App = ({ skipInitialLoad = false }: AppProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [thinking, setThinking] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [config] = useState(loadConfig());
    const [agentStatus, setAgentStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");
    const [view, setView] = useState<"chat" | "session_picker">("chat");
    const [sessions, setSessions] = useState<ACPSession[]>([]);
    const [pickerIndex, setPickerIndex] = useState(0);
    const acpClientRef = useRef<AcpClient | null>(null);
    const [confirmationRequest, setConfirmationRequest] = useState<{
        toolName: string;
        args: any;
        resolve: (allowed: boolean) => void;
    } | null>(null);

    useEffect(() => {
        const command = config.agentCommand || ["gemini", "--acp"];
        const client = new AcpClient({
            command,
            cwd: process.cwd(),
            onStatusChange: setAgentStatus,
            onError: (err) => setError(err),
            onNotification: (method, params) => {
                if (method === "session/update") {
                    const update = params.update;
                    if (!update) return;

                    if (update.sessionUpdate === "user_message_chunk") {
                        const text = update.content?.text;
                        if (text) {
                            setMessages(prev => {
                                const last = prev[prev.length - 1];
                                if (last && last.role === "user") {
                                    const newMessages = [...prev];
                                    newMessages[newMessages.length - 1] = { ...last, content: last.content + text };
                                    return newMessages;
                                }
                                return [...prev, { id: Date.now() + Math.random(), role: "user", content: text }];
                            });
                        }
                    } else if (update.sessionUpdate === "agent_message_chunk") {
                        const text = update.content?.text;
                        if (text) {
                            setMessages(prev => {
                                const last = prev[prev.length - 1];
                                if (last && last.role === "assistant") {
                                    const newMessages = [...prev];
                                    newMessages[newMessages.length - 1] = { ...last, content: last.content + text };
                                    return newMessages;
                                }
                                return [...prev, { id: Date.now() + Math.random(), role: "assistant", content: text }];
                            });
                        }
                    } else if (update.sessionUpdate === "tool_call") {
                        setThinking(`Tool: ${update.title || update.toolCallId}`);
                    } else if (update.sessionUpdate === "tool_call_update") {
                        if (update.status === "completed") {
                            // completed
                        } else if (update.status === "in_progress") {
                            // running
                        }
                    }
                }
            }
        });

        acpClientRef.current = client;
        client.connect().catch(e => setError(e.message));

        return () => {
            client.disconnect();
        };
    }, []);

    useKeyboard((key) => {
        // General keyboard shortcuts can be added here
    });

    const handleInput = useCallback(async (input: string) => {
        if (input.startsWith("/")) {
            const cmd = input.slice(1).trim();
            const parts = cmd.split(/\s+/);
            const baseCmd = parts[0].toLowerCase();
            
            if (baseCmd === "clear") {
                setMessages([]);
                setThinking(null);
                setError(null);
                return;
            }
            if (baseCmd === "history") {
                if (acpClientRef.current) {
                    acpClientRef.current.listSessions().then((res) => {
                        setSessions(res.sessions || []);
                        setPickerIndex(0);
                        setView("session_picker");
                    }).catch(err => setError(err.message));
                }
                return;
            }
            if (baseCmd === "load") {
                const sessionId = parts[1];
                if (!sessionId) {
                    setError("Usage: /load <sessionId>");
                    return;
                }
                if (acpClientRef.current) {
                    acpClientRef.current.loadSession(sessionId).then(() => {
                        setMessages([{
                            id: Date.now(),
                            role: "system",
                            content: `Loaded session: ${sessionId}`
                        }]);
                    }).catch(err => setError(`Load failed: ${err.message}`));
                }
                return;
            }
        }

        const userMsg: Message = {
            id: Date.now(),
            role: "user",
            content: input,
        };

        setMessages((p) => [...p, userMsg]);
        setIsLoading(true);
        setError(null);
        setThinking(null);

        try {
            if (!acpClientRef.current) throw new Error("Agent not connected");
            
            await acpClientRef.current.prompt(input);
            
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
            setThinking(null);
        }
    }, []);

    if (view === "session_picker") {
        return (
            <SessionPicker
                sessions={sessions}
                selectedIndex={pickerIndex}
                onSelect={(session) => {
                    if (session) {
                        setMessages([]);
                        acpClientRef.current?.loadSession(session.sessionId).catch(e => setError(e.message));
                    }
                    setView("chat");
                }}
                onNavigate={(dir) => {
                    const total = sessions.length + 1;
                    if (dir === "up") {
                        setPickerIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
                    } else {
                        setPickerIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
                    }
                }}
            />
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
                    header={<Header agentCommand={(config.agentCommand || []).join(" ")} status={agentStatus} />}
                    footer={
                        <box flexDirection="column">
                            {error && <text fg="red">Error: {error}</text>}
                            <InputArea onSubmit={handleInput} isLoading={isLoading} />
                        </box>
                    }
                >
                    {messages.map((msg, idx) => {
                        const isLast = idx === messages.length - 1;
                        const isAssistant = msg.role === "assistant";
                        return (
                            <box key={msg.id} marginBottom={1}>
                                <MessageComponent
                                    role={msg.role}
                                    content={msg.content}
                                    thinking={(isLast && isAssistant && isLoading) ? (thinking || "thinking...") : undefined}
                                />
                            </box>
                        );
                    })}

                    {(isLoading && messages.length > 0 && messages[messages.length - 1].role === "user") && (
                        <box marginBottom={1}>
                            <MessageComponent
                                role="assistant"
                                content=""
                                thinking={thinking || "thinking..."}
                            />
                        </box>
                    )}
                </Layout>
            )}
        </box>
    );
};
