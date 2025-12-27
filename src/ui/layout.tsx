import React from "react";
import { Box, Text, useStdout } from "ink";

type LayoutProps = {
    header?: React.ReactNode;
    footer?: React.ReactNode;
    children: React.ReactNode;
};

export const Layout: React.FC<LayoutProps> = ({ header, footer, children }) => {
    const { stdout } = useStdout();
    const terminalHeight = stdout?.rows ?? 24;

    return (
        <Box flexDirection="column" height={terminalHeight}>
            {/* Fixed Header */}
            <Box borderStyle="single" borderColor="blue" paddingX={1} flexShrink={0}>
                <Text bold>A 𝕏 E</Text>
            </Box>

            {/* Scrollable Content Area */}
            <Box flexDirection="column" flexGrow={1} overflowY="hidden" paddingX={1}>
                {children}
            </Box>

            {/* Fixed Footer */}
            <Box flexDirection="column" flexShrink={0} paddingX={1}>
                {footer}
            </Box>
        </Box>
    );
};
