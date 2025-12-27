import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { Layout } from "./ui/layout";
import { MessageComponent } from "./ui/message";
import { InputArea } from "./ui/input-area";
import {
    getRecentMessages,
    getAllSessions,
    SESSION_ID,
    type Message,
    type Session,
} from "./lib/db";
import { runAgent } from "./lib/agent";

type View = "chat" | "history";

export const App = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<View>("chat");
    const [sessions, setSessions] = useState<Session[]>([]);
    const [scrollOffset, setScrollOffset] = useState(0);

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

    useInput((input, key) => {
        if (view === "history") {
            if (key.escape || input === "q") {
                setView("chat");
            }
            return;
        }

        if (key.pageUp) {
            setScrollOffset((prev) => Math.max(0, prev - 5));
        }
        if (key.pageDown) {
            setScrollOffset((prev) =>
                Math.min(Math.max(0, messages.length - visibleMessages), prev + 5)
            );
        }

        const mouseEvent = (key as any).mouse;
        if (mouseEvent?.delta?.y && typeof mouseEvent.delta.y === "number") {
            const delta = mouseEvent.delta.y;
            const scrollAmount = delta > 0 ? 3 : -3;
            setScrollOffset((prev) =>
                Math.max(0, Math.min(messages.length - visibleMessages, prev + scrollAmount))
            );
        }
    });

    const handleInput = async (input: string) => {
        if (input.toLowerCase() === "/history") {
            setSessions(getAllSessions());
            setView("history");
            return;
        }

        if (input.toLowerCase() === "/clear") {
            setMessages([]);
            setScrollOffset(0);
            return;
        }

        if (input.toLowerCase() === "/up") {
            setScrollOffset((prev) => Math.max(0, prev - 5));
            return;
        }

        if (input.toLowerCase() === "/down") {
            setScrollOffset((prev) =>
                Math.min(Math.max(0, messages.length - visibleMessages), prev + 5)
            );
            return;
        }

        setIsLoading(true);
        setError(null);

        const userMsg: Message = {
            id: Date.now(),
            session_id: SESSION_ID,
            session_path: process.cwd(),
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
                session_path: process.cwd(),
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

    if (view === "history") {
        return (
            <Layout footer={<Text dimColor>Press 'q' or ESC to go back</Text>}>
                <Box flexDirection="column">
                    <Text bold color="yellow">📂 Chat Sessions</Text>
                    <Text dimColor>─────────────────────────────────────</Text>
                    {sessions.length === 0 ? (
                        <Text dimColor>No sessions found.</Text>
                    ) : (
                        sessions.map((s) => (
                            <Box key={s.session_id}>
                                <Text color={s.session_id === SESSION_ID ? "green" : "white"}>
                                    {s.session_id === SESSION_ID ? "→ " : "  "}
                                    {s.session_path}
                                </Text>
                                <Text dimColor> ({s.message_count} msgs)</Text>
                            </Box>
                        ))
                    )}
                </Box>
            </Layout>
        );
    }

    const displayedMessages = messages.slice(
        scrollOffset,
        scrollOffset + visibleMessages
    );

    const footerContent = (
        <>
            {error && <Text color="red">Error: {error}</Text>}
            <InputArea onSubmit={handleInput} isLoading={isLoading} />
            <Text dimColor>PageUp/Down | Mouse Scroll | /history | /clear</Text>
        </>
    );

    return (
        <Layout footer={footerContent}>
            {scrollOffset > 0 && (
                <Text dimColor>↑ {scrollOffset} more messages above</Text>
            )}

            {displayedMessages.map((msg, idx) => (
                <MessageComponent
                    key={msg.id || idx}
                    role={msg.role}
                    content={msg.content}
                />
            ))}

            {scrollOffset + visibleMessages < messages.length && (
                <Text dimColor>
                    ↓ {messages.length - scrollOffset - visibleMessages} more below
                </Text>
            )}
        </Layout>
    );
};
