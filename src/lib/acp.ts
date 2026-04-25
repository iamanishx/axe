import { spawn, type ChildProcess } from "child_process";

export type AcpClientOptions = {
    command: string[];
    cwd: string;
    onStatusChange?: (status: "connecting" | "connected" | "disconnected" | "error") => void;
    onError?: (error: string) => void;
    onNotification?: (method: string, params: any) => void;
};

export class AcpClient {
    private process: ChildProcess | null = null;
    private messageId = 0;
    private pendingRequests = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();
    private buffer = "";

    constructor(private options: AcpClientOptions) {}

    private sessionId: string | null = null;

    public async connect(): Promise<void> {
        this.options.onStatusChange?.("connecting");

        const [cmd, ...args] = this.options.command;
        
        try {
            this.process = spawn(cmd, args, {
                cwd: this.options.cwd,
                stdio: ["pipe", "pipe", "pipe"],
                env: process.env,
            });

            this.process.stdout?.on("data", (data: Buffer) => {
                require("fs").appendFileSync("axe-debug.log", `[STDOUT]: ${data.toString()}\n`);
                this.buffer += data.toString();
                this.processBuffer();
            });

            this.process.stderr?.on("data", (data: Buffer) => {
                require("fs").appendFileSync("axe-debug.log", `[STDERR]: ${data.toString()}\n`);
            });

            this.process.on("error", (error) => {
                this.options.onError?.(`Process error: ${error.message}`);
                this.options.onStatusChange?.("error");
            });

            this.process.on("close", (code) => {
                this.options.onStatusChange?.("disconnected");
            });

            // Wait a moment for process to start
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (this.process.killed) {
                throw new Error("Process immediately exited");
            }

            // Initialize handshake
            await this.sendRequest("initialize", {
                clientInfo: { name: "axe-tui", version: "0.1.0" },
                protocolVersion: 1
            });

            // Start a new session
            const sessionRes = await this.sendRequest("session/new", {
                cwd: this.options.cwd,
                mcpServers: []
            });
            
            this.sessionId = sessionRes.sessionId;
            this.options.onStatusChange?.("connected");
        } catch (err: any) {
            this.options.onStatusChange?.("error");
            this.options.onError?.(`Failed to connect: ${err.message}`);
            throw err;
        }
    }

    private processBuffer() {
        let newlineIndex;
        while ((newlineIndex = this.buffer.indexOf("\n")) !== -1) {
            const line = this.buffer.slice(0, newlineIndex).trim();
            this.buffer = this.buffer.slice(newlineIndex + 1);

            if (!line) continue;

            try {
                const msg = JSON.parse(line);
                this.handleMessage(msg);
            } catch (err) {
                // Not JSON, ignore or log
            }
        }
    }

    private handleMessage(msg: any) {
        if (msg.jsonrpc !== "2.0") return;

        if (msg.id !== undefined && (msg.result !== undefined || msg.error !== undefined)) {
            // It's a response
            const pending = this.pendingRequests.get(msg.id);
            if (pending) {
                if (msg.error) {
                    pending.reject(msg.error);
                } else {
                    pending.resolve(msg.result);
                }
                this.pendingRequests.delete(msg.id);
            }
        } else if (msg.method) {
            // Notifications like session/update
            this.options.onNotification?.(msg.method, msg.params);
        }
    }

    private sendRequest(method: string, params: any = {}): Promise<any> {
        return new Promise((resolve, reject) => {
            const id = ++this.messageId;
            this.pendingRequests.set(id, { resolve, reject });

            const payload = JSON.stringify({
                jsonrpc: "2.0",
                id,
                method,
                params,
            });

            if (!this.process?.stdin) {
                reject(new Error("No stdin available"));
                return;
            }

            this.process.stdin.write(payload + "\n");
        });
    }

    private sendNotification(method: string, params: any = {}): void {
        const payload = JSON.stringify({
            jsonrpc: "2.0",
            method,
            params,
        });

        this.process?.stdin?.write(payload + "\n");
    }

    public async prompt(text: string): Promise<any> {
        if (!this.sessionId) throw new Error("No active session");
        
        return await this.sendRequest("session/prompt", { 
            sessionId: this.sessionId,
            prompt: [{ type: "text", text }]
        });
    }

    public async listSessions(): Promise<{ sessions: { sessionId: string, cwd: string, title?: string, updatedAt?: string }[] }> {
        return await this.sendRequest("session/list");
    }

    public async createSession(cwd: string): Promise<string> {
        const res = await this.sendRequest("session/new", { cwd, mcpServers: [] });
        this.sessionId = res.sessionId;
        return this.sessionId!;
    }

    public async loadSession(sessionId: string): Promise<any> {
        this.sessionId = sessionId;
        return await this.sendRequest("session/load", { 
            sessionId,
            cwd: this.options.cwd,
            mcpServers: []
        });
    }

    public cancel(): void {
        if (this.sessionId) {
            this.sendNotification("session/cancel", { sessionId: this.sessionId });
        }
    }

    public disconnect(): void {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }
}
