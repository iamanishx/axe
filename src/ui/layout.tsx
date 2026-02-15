import React from "react";
import { useTerminalDimensions } from "@opentui/react";

type LayoutProps = {
    header?: React.ReactNode;
    footer?: React.ReactNode;
    children: React.ReactNode;
};

export const Layout = ({ header, footer, children }: LayoutProps) => {
    const { height } = useTerminalDimensions();

    return (
        <box flexDirection="column" height={height}>
            {header ? <box flexShrink={0}>{header}</box> : null}

            <box flexDirection="column" flexGrow={1} minHeight={1} overflow="hidden">
                <scrollbox height="100%">
                    <box flexDirection="column" paddingLeft={1} paddingRight={1} paddingBottom={1}>
                        {children}
                    </box>
                </scrollbox>
            </box>

            {footer ? (
                <box flexDirection="column" flexShrink={0} paddingLeft={1} paddingRight={1}>
                    {footer}
                </box>
            ) : null}
        </box>
    );
};
