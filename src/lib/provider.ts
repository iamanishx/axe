import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { groq } from "@ai-sdk/groq";
import { anthropic } from "@ai-sdk/anthropic";
import { xai } from "@ai-sdk/xai";
import { loadConfig, getApiKey, type ProviderName } from "./config.js";
import { createGeminiProvider } from 'ai-sdk-provider-gemini-cli';

const OPENAI_COMPATIBLE_URLS: Record<string, string> = {
    deepseek: "https://api.deepseek.com",
    qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    kimi: "https://api.moonshot.cn/v1",
    minimax: "https://api.minimax.chat/v1",
    openai: "https://api.openai.com/v1",
};

const gemini = createGeminiProvider({
  authType: 'oauth-personal',
});

export function getModel(providerName?: ProviderName, modelName?: string) {
    const config = loadConfig();
    const provider = providerName || config.provider;
    const model = modelName || config.model;
    const apiKey = getApiKey(provider);

    switch (provider) {
        case "google":
            return google(model);

        case "anthropic":
            return anthropic(model);

        case "groq":
            return groq(model);

        case "xai":
            return xai(model);

        case "gemini":
            return gemini(model);
            
        case "openai":
        case "deepseek":
        case "qwen":
        case "kimi":
        case "minimax": {
            const openaiClient = createOpenAI({
                baseURL: OPENAI_COMPATIBLE_URLS[provider],
                apiKey: apiKey,
            });
            return openaiClient(model);
        }

        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}

export const PROVIDER_MODELS: Record<ProviderName, string[]> = {
    google: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"],
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1", "o1-mini"],
    anthropic: ["claude-sonnet-4-20250514", "claude-3-5-haiku-latest", "claude-3-opus-latest"],
    groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    xai: ["grok-2", "grok-2-vision", "grok-beta"],
    deepseek: ["deepseek-chat", "deepseek-reasoner"],
    qwen: ["qwen-turbo", "qwen-plus", "qwen-max"],
    kimi: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
    minimax: ["abab6.5-chat", "abab5.5-chat"],
    gemini: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-3-pro-preview","gemini-3-flash-preview"],
};