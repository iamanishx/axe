import React from "react";
import { Box, Text } from "ink";

type AutocompleteProps = {
    items: string[];
    selectedIndex: number;
};

export const Autocomplete: React.FC<AutocompleteProps> = ({ items, selectedIndex }) => {
    if (items.length === 0) return null;

    return (
        <Box flexDirection="column" borderStyle="round" borderColor="blue" paddingX={1}>
            {items.map((item, index) => (
                <Text key={item} color={index === selectedIndex ? "green" : "gray"}>
                    {index === selectedIndex ? "> " : "  "}
                    {item}
                </Text>
            ))}
        </Box>
    );
};