import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

type InputAreaProps = {
    onSubmit: (value: string) => void;
    isLoading: boolean;
};

export const InputArea: React.FC<InputAreaProps> = ({ onSubmit, isLoading }) => {
    const [query, setQuery] = useState("");

    const handleSubmit = (value: string) => {
        if (isLoading || !value.trim()) return;
        onSubmit(value);
        setQuery("");
    };

    return (
        <Box paddingX={1} paddingTop={1}>
            <Box marginRight={1}>
                <Text color="green">❯</Text>
            </Box>
            <TextInput
                value={query}
                onChange={setQuery}
                onSubmit={handleSubmit}
                placeholder={isLoading ? "Thinking..." : "Type your message..."}
            />
        </Box>
    );
};
