import React from "react";
import { Box, Text } from "ink";

type LayoutProps = {
    header?: React.ReactNode;
    footer?: React.ReactNode;
    children: React.ReactNode;
};

export const Layout: React.FC<LayoutProps> = ({ header, footer, children }) => {
    return (
        <Box flexDirection="column">
            {header && (
                <Box borderStyle="single" borderColor="blue" paddingX={1}>
                    {header}
                </Box>
            )}

            <Box flexDirection="column" paddingX={1}>
                {children}
            </Box>

            <Box flexDirection="column" paddingX={1}>
                {footer}
            </Box>
        </Box>
    );
};
