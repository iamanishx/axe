import React from "react";

type AutocompleteProps = {
    items: string[];
    selectedIndex: number;
};

export const Autocomplete = ({ items, selectedIndex }: AutocompleteProps) => {
    if (items.length === 0) return null;

    return (
        <box flexDirection="column" borderStyle="rounded" borderColor="blue" paddingLeft={1} paddingRight={1}>
            {items.map((item, index) => (
                <text key={item} fg={index === selectedIndex ? "green" : "gray"}>
                    {index === selectedIndex ? "> " : "  "}
                    {item}
                </text>
            ))}
        </box>
    );
};