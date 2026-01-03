import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";
import { Autocomplete } from "./autocomplete";
import { getAllFiles } from "../lib/filesystem";

type InputAreaProps = {
    onSubmit: (value: string) => void;
    isLoading: boolean;
};

export const InputArea: React.FC<InputAreaProps> = React.memo(({ onSubmit, isLoading }) => {
    const [query, setQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredFiles, setFilteredFiles] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [allFiles, setAllFiles] = useState<string[]>([]);

    useEffect(() => {
        setAllFiles(getAllFiles());
    }, []);

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

    useInput((input, key) => {
        if (key.upArrow) {
            setSelectedIndex((prev) => Math.max(0, prev - 1));
        }

        if (key.downArrow) {
            setSelectedIndex((prev) => Math.min(filteredFiles.length - 1, prev + 1));
        }

        if (key.return || key.tab) {
            if (filteredFiles[selectedIndex]) {
                const parts = query.split(/\s+/);
                parts.pop();
                const newQuery = [...parts, `@${filteredFiles[selectedIndex]} `].join(" ");
                setQuery(newQuery);
                setShowSuggestions(false);
            }
        }

        if (key.escape) {
            setShowSuggestions(false);
        }
    }, { isActive: showSuggestions });

    const handleSubmit = (value: string) => {
        if (showSuggestions) {
            return;
        }

        if (isLoading || !value.trim()) return;
        onSubmit(value);
        setQuery("");
    };

    return (
        <Box flexDirection="column">
            {showSuggestions && (
                <Autocomplete items={filteredFiles} selectedIndex={selectedIndex} />
            )}

            {/* Input Box */}
            <Box
                borderStyle="round"
                borderColor={isLoading ? "yellow" : "green"}
                paddingX={1}
            >
                {isLoading ? (
                    <Box>
                        <Text color="yellow">
                            <Spinner type="dots" />
                        </Text>
                        <Text color="yellow"> Thinking...</Text>
                    </Box>
                ) : (
                    <Box>
                        <Text color="green" bold>❯ </Text>
                        <TextInput
                            value={query}
                            onChange={handleChange}
                            onSubmit={handleSubmit}
                            placeholder="Ask anything... (@ to reference files)"
                        />
                    </Box>
                )}
            </Box>

            {/* Commands hint */}
            <Box paddingX={1} marginTop={1}>
                <Text dimColor>
                    <Text color="gray">/new</Text> <Text dimColor>•</Text>{" "}
                    <Text color="gray">/clear</Text> <Text dimColor>•</Text>{" "}
                    <Text color="gray">/history</Text> <Text dimColor>•</Text>{" "}
                    <Text color="gray">/provider</Text> <Text dimColor>•</Text>{" "}
                    <Text color="gray">/model</Text>
                </Text>
            </Box>
        </Box>
    );
});
