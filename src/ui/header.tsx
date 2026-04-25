import React from "react";

type HeaderProps = {
    agentCommand: string;
    status: string;
};

export const Header = ({ agentCommand, status }: HeaderProps) => {
    const cwd = process.cwd();
    const dirName = cwd.split("/").pop() || cwd;

    return (
        <box flexDirection="column" paddingLeft={1} paddingRight={1} marginBottom={1}>
            <box>
                <text>
                    <span fg="cyan"><strong>AXE</strong></span>
                    <span fg="#666666"> • </span>
                    <span fg="yellow">{dirName}</span>
                    <span fg="#666666"> • </span>
                    <span fg="magenta">[{agentCommand}]</span>
                    <span fg="#666666"> • </span>
                    <span fg={status === "connected" ? "green" : "red"}>{status}</span>
                </text>
            </box>
            <text fg="#666666">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</text>
        </box>
    );
};
