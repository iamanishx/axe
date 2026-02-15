import React, { useState } from "react";
import { useKeyboard } from "@opentui/react";
import { addAutoAllowedTool } from "../lib/config";

type ConfirmationDialogProps = {
    toolName: string;
    args: any;
    onConfirm: () => void;
    onDeny: () => void;
};

export const ConfirmationDialog = ({ toolName, args, onConfirm, onDeny }: ConfirmationDialogProps) => {
    const [selectedOption, setSelectedOption] = useState<"allow" | "deny" | "always">("allow");

    useKeyboard((key) => {
        if (key.name === "left" || key.name === "up") {
            setSelectedOption((prev) => {
                if (prev === "deny") return "allow";
                if (prev === "always") return "deny";
                return "allow";
            });
        }

        if (key.name === "right" || key.name === "down") {
            setSelectedOption((prev) => {
                if (prev === "allow") return "deny";
                if (prev === "deny") return "always";
                return "always";
            });
        }

        if (key.name === "enter" || key.name === "return") {
            if (selectedOption === "allow") {
                onConfirm();
            } else if (selectedOption === "deny") {
                onDeny();
            } else if (selectedOption === "always") {
                addAutoAllowedTool(toolName);
                onConfirm();
            }
        }
    });

    return (
        <box flexDirection="column" borderStyle="double" borderColor="yellow" padding={1}>
            <text fg="yellow"><strong>⚠️  Tool Execution Confirmation</strong></text>
            <box marginY={1}>
                <text>
                    The agent wants to execute <span fg="cyan"><strong>{toolName}</strong></span> with args:
                </text>
            </box>
            <box marginBottom={1}>
                <text fg="gray">{JSON.stringify(args, null, 2)}</text>
            </box>

            <box gap={2}>
                <text>
                    <span fg={selectedOption === "allow" ? "green" : "white"}><strong>{selectedOption === "allow" ? "◉" : "○"}</strong></span>
                    <span fg={selectedOption === "allow" ? "green" : "white"}> Allow</span>
                </text>
                <text>
                    <span fg={selectedOption === "deny" ? "red" : "white"}><strong>{selectedOption === "deny" ? "◉" : "○"}</strong></span>
                    <span fg={selectedOption === "deny" ? "red" : "white"}> Deny</span>
                </text>
                <text>
                    <span fg={selectedOption === "always" ? "blue" : "white"}><strong>{selectedOption === "always" ? "◉" : "○"}</strong></span>
                    <span fg={selectedOption === "always" ? "blue" : "white"}> Always Allow</span>
                </text>
            </box>

            <box marginTop={1}>
                <text fg="#666666">Use Arrow Keys to select, Enter to confirm</text>
            </box>
        </box>
    );
};
