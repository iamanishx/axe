import { Database } from "bun:sqlite";
import { createHash } from "crypto";

const DB_PATH = `${process.env.HOME || process.env.USERPROFILE}/.bun-tui-chat.db`;
const db = new Database(DB_PATH);

const currentDir = process.cwd();
export const SESSION_ID = createHash("sha256").update(currentDir).digest("hex").slice(0, 16);

db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    session_path TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`CREATE INDEX IF NOT EXISTS idx_session ON messages(session_id)`);

export type Message = {
    id: number;
    session_id: string;
    session_path: string;
    role: "user" | "assistant" | "system";
    content: string;
    created_at: string;
};

export type Session = {
    session_id: string;
    session_path: string;
    message_count: number;
    last_message: string;
};

export function saveMessage(role: "user" | "assistant" | "system", content: string) {
    const query = db.query(
        "INSERT INTO messages (session_id, session_path, role, content) VALUES (?, ?, ?, ?)"
    );
    query.run(SESSION_ID, currentDir, role, content);
}

export function getRecentMessages(limit: number = 50): Message[] {
    const query = db.query(
        "SELECT * FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT ?"
    );
    const messages = query.all(SESSION_ID, limit) as Message[];
    return messages.reverse();
}

export function getAllSessions(): Session[] {
    const query = db.query(`
    SELECT 
      session_id,
      session_path,
      COUNT(*) as message_count,
      MAX(created_at) as last_message
    FROM messages 
    GROUP BY session_id 
    ORDER BY last_message DESC
  `);
    return query.all() as Session[];
}

export function getSessionMessages(sessionId: string, limit: number = 50): Message[] {
    const query = db.query(
        "SELECT * FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT ?"
    );
    const messages = query.all(sessionId, limit) as Message[];
    return messages.reverse();
}
