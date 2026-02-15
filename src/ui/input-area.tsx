import React, { useState, useEffect } from "react";
import { useKeyboard } from "@opentui/react";
import { Autocomplete } from "./autocomplete";
import { getAllFiles } from "../lib/filesystem";

type InputAreaProps = {
    onSubmit: (value: string) => void;
    isLoading: boolean;
};

export const InputArea = React.memo(({ onSubmit, isLoading }: InputAreaProps) => {
    const [query, setQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredFiles, setFilteredFiles] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [allFiles, setAllFiles] = useState<string[]>([]);
    const [spinnerFrame, setSpinnerFrame] = useState(0);

    useEffect(() => {
        setAllFiles(getAllFiles());
    }, []);

    useEffect(() => {
        if (!isLoading) return;
        const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
        const interval = setInterval(() => {
            setSpinnerFrame((prev) => (prev + 1) % frames.length);
        }, 80);
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleChange = (value: string) => {
        setQuery(value);

        const lastWord = value.split(/\s+/).pop() || "";
        if (lastWord.startsWith("@")) {
            const searchTerm = lastWord.slice(1).toLowerCase();
            const matches = allFiles
                .filter((f) => f.toLowerCase().includes(searchTerm))
                .slice(0, 5);

            setFilteredFiles(matches);
            setShowSuggestions(matches.length > 0);
            setSelectedIndex(0);
        } else {
            setShowSuggestions(false);
        }
    };

    useKeyboard((key) => {
        if (showSuggestions) {
            if (key.name === "up") {
                setSelectedIndex((prev) => Math.max(0, prev - 1));
            }

            if (key.name === "down") {
                setSelectedIndex((prev) => Math.min(filteredFiles.length - 1, prev + 1));
            }

            if (key.name === "enter" || key.name === "return" || key.name === "tab") {
                if (filteredFiles[selectedIndex]) {
                    const parts = query.split(/\s+/);
                    parts.pop();
                    const newQuery = [...parts, `@${filteredFiles[selectedIndex]} `].join(" ");
                    setQuery(newQuery);
                    setShowSuggestions(false);
                }
            }

            if (key.name === "escape") {
                setShowSuggestions(false);
            }
        } else {
            if ((key.name === "enter" || key.name === "return") && !isLoading) {
                if (query.trim()) {
                    onSubmit(query);
                    setQuery("");
                }
            }
        }
    });


    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    const currentFrame = frames[spinnerFrame];

    return (
        <box flexDirection="column">
            {showSuggestions && (
                <Autocomplete items={filteredFiles} selectedIndex={selectedIndex} />
            )}

            {/* Input Box */}
            <box
                borderStyle="rounded"
                borderColor={isLoading ? "yellow" : "green"}
                paddingLeft={1}
                paddingRight={1}
            >
                {isLoading ? (
                    <box>
                        <text fg="yellow">
                            {currentFrame} Thinking...
                        </text>
                    </box>
                ) : (
                    <box flexDirection="row">
                        <text fg="green"><strong>❯ </strong></text>
                        <input
                            flexGrow={1}
                            value={query}
                            onChange={handleChange}
                            placeholder="Ask anything... (@ to reference files)"
                            focused={!showSuggestions}
                        />
                    </box>
                )}
            </box>

            {/* Commands hint */}
            <box paddingLeft={1} paddingRight={1}>
                <text fg="#666666">
                    <span fg="gray">/new</span> <span fg="#666666">•</span>{" "}
                    <span fg="gray">/clear</span> <span fg="#666666">•</span>{" "}
                    <span fg="gray">/history</span> <span fg="#666666">•</span>{" "}
                    <span fg="gray">/provider</span> <span fg="#666666">•</span>{" "}
                    <span fg="gray">/model</span>
                </text>
            </box>
        </box>
    );
});

