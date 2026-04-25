import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const CONFIG_DIR = join(homedir(), ".axe");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export type Config = {
    agentCommand: string[];
    autoAllowedTools: string[];
};

const DEFAULT_CONFIG: Config = {
    agentCommand: ["gemini", "--acp"],
    autoAllowedTools: [],
};

export function ensureConfigDir(): void {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }
}

export function configExists(): boolean {
    return existsSync(CONFIG_FILE);
}

export function loadConfig(): Config {
    ensureConfigDir();
    if (!configExists()) {
        return DEFAULT_CONFIG;
    }
    try {
        const raw = readFileSync(CONFIG_FILE, "utf-8");
        return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_CONFIG;
    }
}

export function saveConfig(config: Config): void {
    ensureConfigDir();
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function setAgentCommand(command: string[]): void {
    const config = loadConfig();
    config.agentCommand = command;
    saveConfig(config);
}

export function getAutoAllowedTools(): string[] {
    const config = loadConfig();
    return config.autoAllowedTools || [];
}

export function addAutoAllowedTool(toolName: string): void {
    const config = loadConfig();
    if (!config.autoAllowedTools) {
        config.autoAllowedTools = [];
    }
    if (!config.autoAllowedTools.includes(toolName)) {
        config.autoAllowedTools.push(toolName);
        saveConfig(config);
    }
}
