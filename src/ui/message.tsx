import React from "react";

type MessageProps = {
    role: "user" | "assistant" | "system";
    content: string;
    thinking?: string;
};

export const MessageComponent = React.memo(({ role, content, thinking }: MessageProps) => {
    const isUser = role === "user";

    return (
        <box flexDirection="column">
            {/* Message Header */}
            <box>
                <text>
                    <span fg={isUser ? "green" : "cyan"}><strong>{isUser ? "> You" : "| AXE"}</strong></span>
                </text>
            </box>

            {/* Message Content */}
            <box paddingLeft={2} flexDirection="column">
                {/* Thinking indicator */}
                {thinking && (
                    <box>
                        <text fg="yellow">
                            <span fg="yellow">thinking...</span>
                        </text>
                    </box>
                )}

                {/* Main content */}
                <text>{content}</text>
            </box>
        </box>
    );
});
