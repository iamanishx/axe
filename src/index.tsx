import React from "react";
import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./app";
import dotenv from "dotenv";

dotenv.config();

const renderer = await createCliRenderer({
    exitOnCtrlC: false,
});

const root = createRoot(renderer);
root.render(<App />);
