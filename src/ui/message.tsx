import React from "react";
import { Text, Box } from "ink";

type MessageProps = {
    role: "user" | "assistant" | "system";
    content: string;
};

export const MessageComponent: React.FC<MessageProps> = ({ role, content }) => {
    const isUser = role === "user";

    return (
        <Box flexDirection="column" marginBottom={1}>
            <Text color={isUser ? "green" : "cyan"} bold>
                {isUser ? "❯ You" : "| AI"}:
            </Text>
            <Box paddingLeft={2}>
                <Text>{content}</Text>
            </Box>
        </Box>
    );
};
