import React from "react";
import { Box, Text, useInput } from "ink";
import type { Session } from "../lib/db";

type SessionPickerProps = {
    currentDirSessions: Session[];
    selectedIndex: number;
    onSelect: (session: Session | null) => void;
    onNavigate: (direction: "up" | "down") => void;
};

export const SessionPicker: React.FC<SessionPickerProps> = ({
    currentDirSessions,
    selectedIndex,
    onSelect,
    onNavigate,
}) => {
    const totalItems = currentDirSessions.length + 1;

    useInput((input, key) => {
        if (key.upArrow) {
            onNavigate("up");
        }
        if (key.downArrow) {
            onNavigate("down");
        }
        if (key.return) {
            if (selectedIndex === 0) {
                onSelect(null);
            } else {
                onSelect(currentDirSessions[selectedIndex - 1]);
            }
        }
    });

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <Box flexDirection="column" paddingX={2} paddingY={1}>
            {/* Header */}
            <Box marginBottom={1}>
                <Text color="cyan" bold>
                    AXE
                </Text>
                <Text dimColor> - AI Coding Assistant</Text>
            </Box>

            {/* Divider */}
            <Box marginBottom={1}>
                <Text dimColor>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
            </Box>

            {/* Session Picker Title */}
            <Box marginBottom={1}>
                <Text color="yellow" bold>📂 Select a Session</Text>
            </Box>

            {/* New Session Option */}
            <Box>
                <Text color={selectedIndex === 0 ? "green" : "white"} bold={selectedIndex === 0}>
                    {selectedIndex === 0 ? "▸ " : "  "}
                    <Text color={selectedIndex === 0 ? "green" : "cyan"}>✨ Start New Session</Text>
                </Text>
            </Box>

            {/* Existing Sessions */}
            {currentDirSessions.length > 0 && (
                <Box flexDirection="column" marginTop={1}>
                    <Text dimColor bold>  Recent Sessions:</Text>
                    {currentDirSessions.map((session, idx) => {
                        const itemIdx = idx + 1;
                        const isSelected = selectedIndex === itemIdx;
                        return (
                            <Box key={session.id} paddingLeft={0}>
                                <Text color={isSelected ? "green" : "white"} bold={isSelected}>
                                    {isSelected ? "▸ " : "  "}
                                    <Text color={isSelected ? "green" : "gray"}>💬 </Text>
                                    <Text color={isSelected ? "green" : "white"}>
                                        {session.name || `Session ${session.id.slice(0, 8)}`}
                                    </Text>
                                    <Text dimColor>
                                        {" "}({session.message_count} msgs • {formatDate(session.last_message_at)})
                                    </Text>
                                </Text>
                            </Box>
                        );
                    })}
                </Box>
            )}

            {/* Footer */}
            <Box marginTop={2}>
                <Text dimColor>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
            </Box>
            <Box marginTop={1}>
                <Text dimColor>
                    <Text color="gray">↑↓</Text> Navigate
                    <Text color="gray"> Enter</Text> Select
                </Text>
            </Box>
        </Box>
    );
};
