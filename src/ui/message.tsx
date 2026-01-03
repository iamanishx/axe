import React from "react";
import { Text, Box } from "ink";

type MessageProps = {
    role: "user" | "assistant" | "system";
    content: string;
    thinking?: string;
};

export const MessageComponent: React.FC<MessageProps> = React.memo(({ role, content, thinking }) => {
    const isUser = role === "user";

    return (
        <Box flexDirection="column" marginBottom={1}>
            {/* Message Header */}
            <Box>
                <Text color={isUser ? "green" : "cyan"} bold>
                    {isUser ? "> You" : "| AXE"}
                </Text>
            </Box>

            {/* Message Content */}
            <Box paddingLeft={3} flexDirection="column">
                {/* Thinking indicator */}
                {thinking && (
                    <Box marginBottom={1}>
                        <Text color="yellow" dimColor>
                            💭 {thinking}
                        </Text>
                    </Box>
                )}

                {/* Main content */}
                <Text wrap="wrap">{content}</Text>
            </Box>
        </Box>
    );
});
