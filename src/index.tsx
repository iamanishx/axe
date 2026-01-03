import React from "react";
import { render } from "ink";
import { App } from "./app";
import dotenv from "dotenv";

dotenv.config();

let skipInitialMessages = false;

export const triggerRerender = () => {
    skipInitialMessages = true;
    console.clear(); 
    rerenderFn?.(<App skipInitialLoad={true} />);
};

export const shouldSkipInitialMessages = () => {
    const skip = skipInitialMessages;
    skipInitialMessages = false;
    return skip;
};

let rerenderFn: ((node: React.ReactNode) => void) | null = null;

const { rerender, waitUntilExit } = render(<App skipInitialLoad={false} />);
rerenderFn = rerender;

waitUntilExit();
