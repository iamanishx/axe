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
            <Text color={isUser ? "green" : "cyan"} bold>
                {isUser ? "❯ You" : "| AI"}:
            </Text>
            <Box paddingLeft={2} flexDirection="column">
                {thinking && (
                    <Box marginBottom={1}>
                        <Text color="gray" dimColor>
                            ⚙ {thinking}
                        </Text>
                    </Box>
                )}
                <Text>{content}</Text>
            </Box>
        </Box>
    );
});
