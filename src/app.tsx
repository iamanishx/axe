import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { Layout } from "./ui/layout.js";
import { MessageComponent } from "./ui/message.js";
import { InputArea } from "./ui/input-area.js";
import {
    getRecentMessages,
    getCurrentDirSessions,
    getOtherDirSessions,
    getSessionMessages,
    SESSION_ID,
    type Message,
    type Session,
} from "./lib/db.js";
import { runAgent } from "./lib/agent.js";
import { loadConfig, setProvider, type ProviderName } from "./lib/config.js";
import { PROVIDER_MODELS } from "./lib/provider.js";

type View = "chat" | "history" | "provider" | "model";

export const App = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<View>("chat");
    const [currentDirSessions, setCurrentDirSessions] = useState<Session[]>([]);
    const [otherDirSessions, setOtherDirSessions] = useState<Session[]>([]);
    const [scrollOffset, setScrollOffset] = useState(0);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [config, setConfig] = useState(loadConfig());

    const { stdout } = useStdout();
    const terminalHeight = stdout?.rows ?? 24;
    const visibleMessages = Math.max(5, terminalHeight - 8);

    useEffect(() => {
        try {
            const recent = getRecentMessages(100);
            setMessages(recent);
            setScrollOffset(Math.max(0, recent.length - visibleMessages));
        } catch (e: any) {
            setError("Failed to load database: " + e.message);
        }
    }, []);

    const providers = Object.keys(PROVIDER_MODELS) as ProviderName[];
    const currentModels = PROVIDER_MODELS[config.provider] || [];

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
                const msgs = getSessionMessages(session.id, 100);
                setMessages(msgs);
                setScrollOffset(Math.max(0, msgs.length - visibleMessages));
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

        if (key.pageUp) setScrollOffset((prev) => Math.max(0, prev - 5));
        if (key.pageDown) setScrollOffset((prev) => Math.min(Math.max(0, messages.length - visibleMessages), prev + 5));
    });

    const handleInput = async (input: string) => {
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

        if (cmd === "/clear") {
            setMessages([]);
            setScrollOffset(0);
            return;
        }

        setIsLoading(true);
        setError(null);

        const userMsg: Message = {
            id: Date.now(),
            session_id: SESSION_ID,
            role: "user",
            content: input,
            created_at: new Date().toISOString(),
        };

        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setScrollOffset(Math.max(0, newHistory.length - visibleMessages));

        try {
            const agentHistory = newHistory.map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            }));

            const responseText = await runAgent(input, agentHistory);

            const aiMsg: Message = {
                id: Date.now() + 1,
                session_id: SESSION_ID,
                role: "assistant",
                content: responseText,
                created_at: new Date().toISOString(),
            };

            const finalMessages = [...newHistory, aiMsg];
            setMessages(finalMessages);
            setScrollOffset(Math.max(0, finalMessages.length - visibleMessages));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (view === "provider") {
        return (
            <Layout footer={<Text dimColor>↑↓ Navigate | Enter Select | q Back</Text>}>
                <Box flexDirection="column">
                    <Text bold color="cyan">Select Provider</Text>
                    <Text dimColor>─────────────────────────────</Text>
                    {providers.map((p, i) => (
                        <Text key={p} color={i === selectedIdx ? "green" : "white"}>
                            {i === selectedIdx ? "→ " : "  "}{p} {p === config.provider ? "(current)" : ""}
                        </Text>
                    ))}
                </Box>
            </Layout>
        );
    }

    if (view === "model") {
        return (
            <Layout footer={<Text dimColor>↑↓ Navigate | Enter Select | q Back</Text>}>
                <Box flexDirection="column">
                    <Text bold color="cyan">Select Model ({config.provider})</Text>
                    <Text dimColor>─────────────────────────────</Text>
                    {currentModels.map((m, i) => (
                        <Text key={m} color={i === selectedIdx ? "green" : "white"}>
                            {i === selectedIdx ? "→ " : "  "}{m} {m === config.model ? "(current)" : ""}
                        </Text>
                    ))}
                </Box>
            </Layout>
        );
    }

    if (view === "history") {
        const allSessions = [...currentDirSessions, ...otherDirSessions];
        return (
            <Layout footer={<Text dimColor>↑↓ Navigate | Enter Load | q Back</Text>}>
                <Box flexDirection="column">
                    <Text bold color="yellow">📂 Current Directory</Text>
                    {currentDirSessions.length === 0 ? (
                        <Text dimColor>  No sessions</Text>
                    ) : (
                        currentDirSessions.map((s, i) => (
                            <Text key={s.id} color={i === selectedIdx ? "green" : "white"}>
                                {i === selectedIdx ? "→ " : "  "}Session ({s.message_count} msgs)
                            </Text>
                        ))
                    )}
                    <Text> </Text>
                    <Text bold color="blue">📁 Other Directories</Text>
                    {otherDirSessions.length === 0 ? (
                        <Text dimColor>  No sessions</Text>
                    ) : (
                        otherDirSessions.map((s, i) => {
                            const idx = currentDirSessions.length + i;
                            return (
                                <Text key={s.id} color={idx === selectedIdx ? "green" : "white"}>
                                    {idx === selectedIdx ? "→ " : "  "}{s.path} ({s.message_count} msgs)
                                </Text>
                            );
                        })
                    )}
                </Box>
            </Layout>
        );
    }

    const displayedMessages = messages.slice(scrollOffset, scrollOffset + visibleMessages);

    const footerContent = (
        <>
            {error && <Text color="red">Error: {error}</Text>}
            <InputArea onSubmit={handleInput} isLoading={isLoading} />
            <Text dimColor>{config.provider}/{config.model} | /provider /model /history /clear</Text>
        </>
    );

    return (
        <Layout footer={footerContent}>
            {scrollOffset > 0 && <Text dimColor>↑ {scrollOffset} more messages above</Text>}
            {displayedMessages.map((msg, idx) => (
                <MessageComponent key={msg.id || idx} role={msg.role} content={msg.content} />
            ))}
            {scrollOffset + visibleMessages < messages.length && (
                <Text dimColor>↓ {messages.length - scrollOffset - visibleMessages} more below</Text>
            )}
        </Layout>
    );
};
