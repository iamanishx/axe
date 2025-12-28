import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const CONFIG_DIR = join(homedir(), ".axe");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export type ProviderName =
    | "google"
    | "openai"
    | "anthropic"
    | "groq"
    | "xai"
    | "deepseek"
    | "qwen"
    | "kimi"
    | "minimax";

export type Config = {
    provider: ProviderName;
    model: string;
    keys: Partial<Record<ProviderName, string>>;
};

const DEFAULT_CONFIG: Config = {
    provider: "google",
    model: "gemini-2.5-flash",
    keys: {},
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

export function getApiKey(provider: ProviderName): string | undefined {
    const config = loadConfig();
    return config.keys[provider];
}

export function setApiKey(provider: ProviderName, key: string): void {
    const config = loadConfig();
    config.keys[provider] = key;
    saveConfig(config);
}

export function setProvider(provider: ProviderName, model: string): void {
    const config = loadConfig();
    config.provider = provider;
    config.model = model;
    saveConfig(config);
}
