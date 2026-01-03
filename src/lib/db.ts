import { Database } from "bun:sqlite";
import { createHash } from "crypto";
import { homedir } from "os";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";

const AXE_DIR = join(homedir(), ".axe");
if (!existsSync(AXE_DIR)) {
    mkdirSync(AXE_DIR, { recursive: true });
}

const DB_PATH = join(AXE_DIR, "chat.db");
const db = new Database(DB_PATH);

const currentDir = process.cwd();

let currentSessionId = createHash("sha256").update(currentDir).digest("hex").slice(0, 16);

export function getSessionId(): string {
    return currentSessionId;
}

export function setSessionId(id: string) {
    currentSessionId = id;
}

db.run(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_message_at DATETIME
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  )
`);

db.run(`CREATE INDEX IF NOT EXISTS idx_session ON messages(session_id)`);

function ensureSession(sessionId: string, path: string) {
    const existing = db.query("SELECT id FROM sessions WHERE id = ?").get(sessionId);
    if (!existing) {
        db.run("INSERT INTO sessions (id, path) VALUES (?, ?)", [sessionId, path]);
    }
}

export type Message = {
    id: number;
    session_id: string;
    role: "user" | "assistant" | "system";
    content: string;
    created_at: string;
};

export type Session = {
    id: string;
    path: string;
    name: string | null;
    message_count: number;
    last_message_at: string;
};

export function saveMessage(role: "user" | "assistant" | "system", content: string) {
    ensureSession(currentSessionId, currentDir);
    db.run("INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)", [
        currentSessionId,
        role,
        content,
    ]);
    db.run("UPDATE sessions SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?", [currentSessionId]);
}

export function getRecentMessages(limit: number = 50): Message[] {
    const query = db.query(
        "SELECT * FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT ?"
    );
    const messages = query.all(currentSessionId, limit) as Message[];
    return messages.reverse();
}

export function getCurrentDirSessions(): Session[] {
    const query = db.query(`
    SELECT s.id, s.path, s.name, s.last_message_at,
           (SELECT COUNT(*) FROM messages WHERE session_id = s.id) as message_count
    FROM sessions s
    WHERE s.path = ?
    ORDER BY s.last_message_at DESC
  `);
    return query.all(currentDir) as Session[];
}

export function getOtherDirSessions(): Session[] {
    const query = db.query(`
    SELECT s.id, s.path, s.name, s.last_message_at,
           (SELECT COUNT(*) FROM messages WHERE session_id = s.id) as message_count
    FROM sessions s
    WHERE s.path != ?
    ORDER BY s.last_message_at DESC
  `);
    return query.all(currentDir) as Session[];
}

export function getSessionMessages(sessionId: string, limit: number = 50): Message[] {
    const query = db.query(
        "SELECT * FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT ?"
    );
    const messages = query.all(sessionId, limit) as Message[];
    return messages.reverse();
}

export function createNewSession(): string {
    const newId = createHash("sha256")
        .update(currentDir + Date.now().toString())
        .digest("hex")
        .slice(0, 16);
    
    // Count existing sessions in this directory to generate a name
    const countQuery = db.query("SELECT COUNT(*) as count FROM sessions WHERE path = ?");
    const result = countQuery.get(currentDir) as { count: number };
    const sessionName = `Session ${result.count + 1}`;

    db.run("INSERT INTO sessions (id, path, name) VALUES (?, ?, ?)", [newId, currentDir, sessionName]);
    currentSessionId = newId;
    return newId;
}
