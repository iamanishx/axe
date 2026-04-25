import React from "react";
import { useKeyboard } from "@opentui/react";

export type ACPSession = {
    sessionId: string;
    cwd: string;
    title?: string;
    updatedAt?: string;
};

type SessionPickerProps = {
    sessions: ACPSession[];
    selectedIndex: number;
    onSelect: (session: ACPSession | null) => void;
    onNavigate: (direction: "up" | "down") => void;
};

export const SessionPicker = ({
    sessions,
    selectedIndex,
    onSelect,
    onNavigate,
}: SessionPickerProps) => {
    const totalItems = sessions.length + 1;

    useKeyboard((key) => {
        if (key.name === "up") {
            onNavigate("up");
        }
        if (key.name === "down") {
            onNavigate("down");
        }
        if (key.name === "enter" || key.name === "return") {
            if (selectedIndex === 0) {
                onSelect(null);
            } else {
                onSelect(sessions[selectedIndex - 1]);
            }
        }
    });

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "unknown time";
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
        <box flexDirection="column" paddingLeft={2} paddingRight={2} paddingBottom={1} paddingTop={1}>
            {/* Header */}
            <box marginBottom={1}>
                <text fg="cyan"><strong>AXE</strong></text>
                <text fg="#666666"> - AI Coding Assistant</text>
            </box>

            {/* Divider */}
            <box marginBottom={1}>
                <text fg="#666666">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</text>
            </box>

            {/* Session Picker Title */}
            <box marginBottom={1}>
                <text fg="yellow"><strong>📂 Select a Session</strong></text>
            </box>

            {/* New Session Option */}
            <box>
                <text>
                    <span fg={selectedIndex === 0 ? "green" : "white"}><strong>{selectedIndex === 0 ? "▸ " : "  "}</strong></span>
                    <span fg={selectedIndex === 0 ? "green" : "cyan"}>✨ Start New Session (Back to chat)</span>
                </text>
            </box>

            {/* Existing Sessions */}
            {sessions.length > 0 && (
                <box flexDirection="column" marginTop={1}>
                    <text fg="#666666"><strong>  Recent Sessions:</strong></text>
                    {sessions.map((session, idx) => {
                        const itemIdx = idx + 1;
                        const isSelected = selectedIndex === itemIdx;
                        return (
                            <box key={session.sessionId} paddingLeft={0}>
                                <text>
                                    <span fg={isSelected ? "green" : "white"}><strong>{isSelected ? "▸ " : "  "}</strong></span>
                                    <span fg={isSelected ? "green" : "gray"}>💬 </span>
                                    <span fg={isSelected ? "green" : "white"}>
                                        {session.title || `Session ${session.sessionId.slice(0, 8)}`}
                                    </span>
                                    <span fg="#666666">
                                        {" "} ( {formatDate(session.updatedAt)} )
                                    </span>
                                </text>
                            </box>
                        );
                    })}
                </box>
            )}

            {/* Footer */}
            <box marginTop={2}>
                <text fg="#666666">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</text>
            </box>
            <box marginTop={1}>
                <text fg="#666666">
                    <span fg="gray">↑↓</span> Navigate
                    <span fg="gray"> Enter</span> Select
                </text>
            </box>
        </box>
    );
};
