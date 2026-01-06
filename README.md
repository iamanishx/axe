# axe

AI-powered TUI code assistant. Talk to your codebase from the terminal.

![axe demo](public/image.png)

## Install

```bash
bun install -g axe-cli
```

Or run directly:
```bash
bunx axe-cli
```

## Features

- **Multi-provider** - Google, OpenAI, Anthropic, Groq, xAI, DeepSeek, Qwen, Kimi, MiniMax
- **File system access** - Read, write, search files via MCP
- **Shell commands** - Run terminal commands through AI
- **Per-directory sessions** - Chat history tied to your project
- **Lightweight** - Built with Bun + Ink
- **Ralph Loop** - Continuous autonomy for complex tasks (experimental)

## Commands

| Command | Action |
|---------|--------|
| `/provider` | Switch AI provider |
| `/model` | Switch model |
| `/agent` | Switch agent type (Standard vs Ralph Loop) |
| `/history` | View chat sessions |
| `/clear` | Clear chat |

## Config

API keys stored in `~/.axe/config.json`:

```json
{
  "provider": "google",
  "model": "gemini-2.5-flash",
  "keys": {
    "google": "your-api-key"
  }
}
```

## License

MIT
