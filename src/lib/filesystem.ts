import { readdirSync, statSync, readFileSync, existsSync } from "fs";
import { join, relative } from "path";

const DEFAULT_IGNORE = [
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".next",
    ".cache",
    ".vscode",
    ".idea",
    ".DS_Store",
    "bun.lock",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml"
];

function parseGitIgnore(dir: string): string[] {
    const gitignorePath = join(dir, ".gitignore");
    if (!existsSync(gitignorePath)) return [];

    try {
        const content = readFileSync(gitignorePath, "utf-8");
        return content
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith("#"));
    } catch {
        return [];
    }
}

function isIgnored(path: string, ignorePatterns: string[]): boolean {
    const fileName = path.split("/").pop() || "";
    
    if (DEFAULT_IGNORE.some(pattern => path.includes(pattern))) return true;

    for (const pattern of ignorePatterns) {
        if (pattern.endsWith("/")) {
            const dirPattern = pattern.slice(0, -1);
            if (path.includes(dirPattern)) return true;
        } else if (pattern.startsWith("*")) {
            const ext = pattern.slice(1);
            if (fileName.endsWith(ext)) return true;
        } else {
            if (path.includes(pattern)) return true;
        }
    }
    return false;
}

export function getAllFiles(dir: string = process.cwd()): string[] {
    const files: string[] = [];
    const ignorePatterns = parseGitIgnore(dir);

    function walk(currentDir: string) {
        try {
            const entries = readdirSync(currentDir);

            for (const entry of entries) {
                const fullPath = join(currentDir, entry);
                const relPath = relative(dir, fullPath);

                if (isIgnored(relPath, ignorePatterns)) continue;

                const stat = statSync(fullPath);

                if (stat.isDirectory()) {
                    walk(fullPath);
                } else {
                    files.push(relPath);
                }
            }
        } catch (e) {
        }
    }

    walk(dir);
    return files;
}