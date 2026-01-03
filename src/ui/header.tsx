import React from "react";
import { Box, Text } from "ink";

type HeaderProps = {
    provider: string;
    model: string;
};

export const Header: React.FC<HeaderProps> = ({ provider, model }) => {
    const cwd = process.cwd();
    const dirName = cwd.split("/").pop() || cwd;

    return (
        <Box flexDirection="column" paddingX={1} marginBottom={1}>
            <Box>
                <Text color="cyan" bold>AXE</Text>
                <Text dimColor> • </Text>
                <Text color="yellow">{dirName}</Text>
                <Text dimColor> • </Text>
                <Text color="magenta">{provider}/{model}</Text>
            </Box>
            <Text dimColor>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
        </Box>
    );
};
