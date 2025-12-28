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
export const SESSION_ID = createHash("sha256").update(currentDir).digest("hex").slice(0, 16);

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
    ensureSession(SESSION_ID, currentDir);
    db.run("INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)", [
        SESSION_ID,
        role,
        content,
    ]);
    db.run("UPDATE sessions SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?", [SESSION_ID]);
}

export function getRecentMessages(limit: number = 50): Message[] {
    const query = db.query(
        "SELECT * FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT ?"
    );
    const messages = query.all(SESSION_ID, limit) as Message[];
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
    db.run("INSERT INTO sessions (id, path) VALUES (?, ?)", [newId, currentDir]);
    return newId;
}
